import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('./.env') });

async function main(): Promise<void> {

	const loader: CheerioWebBaseLoader = new CheerioWebBaseLoader(
		"https://docs.smith.langchain.com/user_guide"
	);
	const docs: Document<Record<any, any>>[] = await loader.load();

	const splitter: RecursiveCharacterTextSplitter = new RecursiveCharacterTextSplitter({
		chunkSize: 500,
		chunkOverlap: 20,
		separators: ['.', '\n', ' ', '\r']
	});
	const splitDocs: Document<Record<any, any>>[] = await splitter.splitDocuments(docs);

	console.log(splitDocs.length);
	console.log(splitDocs[0].pageContent.length);
}

main().then().catch(err => console.error(err))
