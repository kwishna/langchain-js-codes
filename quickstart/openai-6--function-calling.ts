import { AzureKeyCredential, ChatChoice, ChatCompletions, OpenAIClient } from '@azure/openai';
import process from 'node:process';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { ChatCompletionsToolDefinition } from '@azure/openai/types/openai';
import { ChatRequestMessage } from '@azure/openai/types/src/models/models';

dotenv.config({ path: resolve('./.env') });

// Microsoft OpenAI Client.
const client: OpenAIClient = new OpenAIClient(
	process.env.AZURE_OPENAI_API_ENDPOINT,
	new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY)
);

// user-location data table
const user_locations: Record<string, string> = {
	'ram': 'ayodhya',
	'krishna': 'mathura',
	'shiva': 'varanasi'
};

// location-temperature data table
const locations_temp_in_celsius: Record<string, string> = {
	'ayodhya': '32',
	'varanasi': '28',
	'mathura': '37'
};

/**
 * Function to fetch current user location
 * @param user
 */
function get_current_user_location(user: string): string {
	const allUsers: string[] = Object.keys(user_locations).map(_u => _u.toLowerCase());
	if (allUsers.includes(user.toLowerCase())) {
		return user_locations[user];
	} else {
		return `No Location Found For The User: ${user}`;
	}
}

/**
 * Function to fetch current weather for the given location
 * @param location
 */
function get_current_location_weather(location: string): string {
	const allLocations: string[] = Object.keys(locations_temp_in_celsius);
	if (allLocations.includes(location.toLowerCase())) {
		return locations_temp_in_celsius[location];
	} else {
		return `No Temperature Found For The User: ${location}`;
	}
}

// Tool definition for location weather.
const getCurrentLocationWeather: ChatCompletionsToolDefinition = {
	type: 'function',
	function: {
		name: 'get_current_location_weather',
		description: 'Get the current weather for the given location',
		parameters: {
			type: 'object',
			properties: {
				location: {
					type: 'string',
					description: 'The city and state, e.g. San Francisco, CA'
				}
			},
			required: ['location']
		}
	}
};

// Tool definition for current user location
const getCurrentUserLocation: ChatCompletionsToolDefinition = {
	type: 'function',
	function: {
		name: 'get_current_user_location',
		description: 'Get current location for the user',
		parameters: {
			type: 'object',
			properties: {
				user: {
					type: 'string',
					description: 'The name of the user, e.g. ram, krishna etc'
				}
			},
			required: ['user']
		}
	}
};

async function makeOpenAICall(messages: ChatRequestMessage[]): Promise<ChatCompletions> {

	console.log('================ MAKING CHATGPT CALL ======================');

	const completion: ChatCompletions = await client.getChatCompletions(
		'gpt-4',
		messages,
		{
			temperature: 0.7,
			responseFormat: {
				type: 'json_object'
			},
			toolChoice: 'auto',
			tools: [getCurrentUserLocation, getCurrentLocationWeather]
		}
	);
	console.log('============================================');
	return completion;
}

async function main(messages: ChatRequestMessage[]): Promise<void> {

	let completion: ChatCompletions = await makeOpenAICall(messages); // Make 1st call to GPT.

	let i: number = 0;

	while (i < 3) { // Max 3 times in loop

		const choice: ChatChoice = completion.choices[0]; // 1st choice for the OpenAI response.

		if (choice.finishReason === 'tool_calls') { // If the finish reason is 'tool_calls'

			// Adding previous call assistant response to messages.
			messages.push(
				{
					'role': 'assistant',
					'toolCalls': [{
						type: 'function',
						function: {
							'name': choice.message.toolCalls[0].function.name,
							'arguments': choice.message.toolCalls[0].function.arguments
						},
						id: choice.message.toolCalls[0].id
					}],
					'content': ''
				}
			);

			// For each tool call - Make tool request
			for (const toolCall of choice.message.toolCalls) {

				console.log('=================== TOOL_CALL =====================');

				const function_name: string = toolCall.function.name;
				const function_args: string = JSON.parse(toolCall.function.arguments);

				let tool_call_response: string;

				switch (function_name) {
					case 'get_current_user_location':
						tool_call_response = get_current_user_location(function_args['user']);
						break;

					case 'get_current_location_weather':
						tool_call_response = get_current_location_weather(function_args['location']);
						break;

					default:
						messages.push({ role: 'assistant', content: undefined });
				}

				// Adding tool call response to messages
				messages.push(
					{
						'role': 'tool',
						'content': tool_call_response,
						'toolCallId': choice.message.toolCalls[0].id
					}
				);
			}
		} else if (choice.finishReason === 'stop') {
			console.log('============== STOP ===============');
			console.log(completion);
			console.log("------------------------------------");
			console.log(choice.message.content);
			break;
		}
		else if (choice.finishReason === 'length') {
			console.log('============== STOP ===============');
			console.log(completion);
			console.log("------------------------------------");
			console.log(choice.message.content);
			break;
		}
		else {
			console.log('============== UNEXPECTED FINISH REASON ===============');
			console.log(completion);
			console.log("------------------------------------");
			console.log(choice.message.content);
			break;
		}

		// console.log('===============================================================');
		// console.log(JSON.stringify(messages, null, 2));
		// console.log('===============================================================');

		// Making Another Call To OpenAI After Adding `Tool` Response To The Messages.
		completion = await makeOpenAICall(messages);

		i++;
	}
}


const query: string = 'Base on the weather for \'krishna\'. Please plan clothing that he can wear.';

const messages: ChatRequestMessage[] = [
	{
		role: 'system',
		content: 'You\'re an AI assistant. You always tell fact and doesn\'t cook-up false information. If you don\'t have sufficient info. Say it upfront.'
	},
	{
		role: 'assistant',
		content: 'Based on the query, you should take action thinking step-step and breaking into smaller tasks and respond in a JSON format. Decide the keys for the JSON response yourself.'
	},
	{ role: 'user', content: query }
];

main(messages).catch((err): void => {
	console.error('The sample encountered an error:', err);
});

/*
{
  "location": "Mathura",
  "temperature_celsius": 37,
  "clothing_advice": {
    "top_wear": "Lightweight, light-colored, and loose-fitting clothing",
    "bottom_wear": "Shorts or light fabric trousers",
    "footwear": "Comfortable sandals or open shoes",
    "accessories": "Sunglasses, a wide-brimmed hat, and sunscreen"
  }
}
 */
