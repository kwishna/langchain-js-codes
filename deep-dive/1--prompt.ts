import { ChatPromptTemplate } from '@langchain/core/prompts';

async function main(): Promise<void> {
	const prompt: ChatPromptTemplate = ChatPromptTemplate.fromMessages([
		['human', 'Tell me a short joke about {topic}']
	]);

	const promptValue = await prompt.invoke({ topic: 'ice cream' });
	console.log('-----------------------------------------------------------');
	console.log(JSON.stringify(promptValue, null, 2));

	const promptAsMessages = promptValue.toChatMessages();
	console.log('-----------------------------------------------------------');
	console.log(JSON.stringify(promptAsMessages, null, 2));

	const promptAsString: string = promptValue.toString();
	console.log('-----------------------------------------------------------');
	console.log(JSON.stringify(promptAsString, null, 2));
	/**
		Human: Tell me a short joke about ice cream
	 */
}

main().then().catch(err => console.error(err))
