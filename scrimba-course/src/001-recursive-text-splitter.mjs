import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { resolve } from "path";
import fs from 'fs';
try {
    const result = fs.readFileSync(resolve('./scrimba-course/src/scrimba-info.txt'));
    const text = result.toString();

    const splitter = new RecursiveCharacterTextSplitter(
        {
            chunkOverlap: 10,
            chunkSize: 500,
            separators: ['.', '\n\n', '\n', ' ', '\r', "##"]
        }
    );

    const output = await splitter.createDocuments([text]);
    console.log(JSON.stringify(output[0], null, 2));
    console.log(output[0].pageContent.length);
} catch (err) {
    console.log(err)
}