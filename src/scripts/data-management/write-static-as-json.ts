
import fs from 'node:fs';
import path from 'node:path';

export default function writeStaticAsJson(data: unknown, dest: string, minified?: boolean) {

  	const outPath = path.resolve(dest);

  	fs.mkdirSync(path.dirname(outPath), { recursive: true });

    if(minified) {
  		fs.writeFileSync(
    		outPath,
    		JSON.stringify(data),
    		'utf-8'
  		);
	} else {
    	fs.writeFileSync(
    		outPath,
    		JSON.stringify(data, null, 2),
    		'utf-8'
    	);
  	}

}
