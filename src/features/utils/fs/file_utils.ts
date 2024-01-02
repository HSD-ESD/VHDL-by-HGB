//Specific Imports

//General Imports
import * as chokidar from 'chokidar';
import * as path from 'path';


export class FileUtils {

    public static async WaitForFileCreation(filePath : string, timeout : number = 5000) : Promise<boolean> {

        return new Promise((resolve, reject) => {
    
            // watch folder of given filePath
            const watcher = chokidar.watch( path.join(filePath,".."));
        
            // Event listener for file creation
            watcher.on('add', (path) => {
                if (path === filePath) {
                    watcher.close();
                    resolve(true);
                }
            });
    
            // Event listener for file change
            watcher.on('change', (path) => {
                if (path === filePath) { // Check if the changed file is the specified one
                    watcher.close();
                    resolve(true);
                }
            });
        
            // Handle errors
            watcher.on('error', (error) => {
                watcher.close();
                reject(error);
            });
        
            // Timeout
            setTimeout(() => {
                watcher.close();
                reject(new Error(`Timeout waiting for file creation: ${filePath}`));
            }, timeout);
    
        });
    
      }

}