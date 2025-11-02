/**
 * Script to download and parse the CC-CEDICT Chinese-English dictionary
 * and generate a JSON file for Pinyin-to-Chinese conversion.
 * This script uses only JavaScript (Node.js) with no external dependencies.
 */

const https = require('https');
const fs = require('fs');
const zlib = require('zlib');

// CC-CEDICT download URL
const CEDICT_URL = 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';

/**
 * Download the latest CC-CEDICT file
 */
function downloadCedict() {
  return new Promise((resolve, reject) => {
    console.log('Downloading CC-CEDICT dictionary...');
    
    const file = fs.createWriteStream('cedict.txt.gz');
    
    https.get(CEDICT_URL, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('Downloaded cedict.txt.gz');
        resolve('cedict.txt.gz');
      });
      
      file.on('error', (err) => {
        fs.unlink('cedict.txt.gz', () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Convert Pinyin with tone numbers to plain Pinyin without tones
 * Example: "ni3" -> "ni", "lv4" -> "lu"
 */
function parsePinyin(pinyinStr) {
  // Remove tone numbers (0-4)
  let plainPinyin = pinyinStr.toLowerCase().replace(/[0-4]/g, '');
  
  // Handle special cases like "ü" -> "u"
  plainPinyin = plainPinyin.replace(/ü/g, 'u');
  
  return plainPinyin;
}

/**
 * Parse the CC-CEDICT file and create a mapping from Pinyin to Chinese words
 */
function parseCedictFile(filename) {
  return new Promise((resolve, reject) => {
    console.log('Parsing CC-CEDICT file...');
    
    // Dictionary to store Pinyin -> Chinese mappings
    const pinyinDict = {};
    
    // Counter for processed entries
    let processedCount = 0;
    
    // Create a read stream for the gzipped file
    const gunzip = zlib.createGunzip();
    const fileStream = fs.createReadStream(filename);
    
    // Buffer to accumulate data
    let buffer = '';
    
    gunzip.on('data', (data) => {
      buffer += data.toString();
      let lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the last incomplete line in buffer
      
      for (let line of lines) {
        // Skip comments and empty lines
        if (line.startsWith('#') || !line.trim()) {
          continue;
        }
        
        // Parse the line
        // Format: Traditional Simplified [Pinyin] /English/
        // Example: 中國 中国 [Zhong1 guo2] /China/Middle Kingdom/
        const match = line.match(/^(.+?) (.+?) \[(.+?)\] \/([^\/]+?)\//);
        if (match) {
          const [, traditional, simplified, pinyin, english] = match;
          
          // Split Pinyin into components
          const pinyinParts = pinyin.split(' ');
          
          // Create plain Pinyin (without tones)
          const plainPinyin = pinyinParts.map(parsePinyin).join('');
          
          // Create the entry with Chinese characters and English meaning
          const chineseChars = simplified;  // Using simplified characters
          const entry = `${chineseChars} (${english.split('/')[0]})`;  // First meaning
          
          // Add to dictionary
          if (!pinyinDict[plainPinyin]) {
            pinyinDict[plainPinyin] = [];
          }
          
          // Avoid duplicates
          if (!pinyinDict[plainPinyin].includes(entry)) {
            pinyinDict[plainPinyin].push(entry);
          }
          
          processedCount++;
          
          // Print progress every 10000 entries
          if (processedCount % 10000 === 0) {
            console.log(`Processed ${processedCount} entries...`);
          }
        }
      }
    });
    
    gunzip.on('end', () => {
      console.log(`Finished parsing. Processed ${processedCount} entries.`);
      resolve(pinyinDict);
    });
    
    gunzip.on('error', (err) => {
      reject(err);
    });
    
    // Pipe the streams together
    fileStream.pipe(gunzip);
  });
}

/**
 * Save the parsed dictionary to a JSON file
 */
function saveToJson(data, filename = 'cedict.json') {
  return new Promise((resolve, reject) => {
    console.log(`Saving data to ${filename}...`);
    
    try {
      // Sort the dictionary by keys for better organization
      const sortedData = {};
      Object.keys(data)
        .sort()
        .forEach(key => {
          sortedData[key] = data[key];
        });
      
      fs.writeFile(filename, JSON.stringify(sortedData, null, 2), 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Saved ${Object.keys(sortedData).length} unique Pinyin entries to ${filename}`);
          resolve(true);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Main function to download, parse, and save the CC-CEDICT dictionary
 */
async function main() {
  console.log('CC-CEDICT Parser (JavaScript Only)');
  console.log('='.repeat(50));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log();
  
  try {
    // Step 1: Download the dictionary
    const gzFilename = await downloadCedict();
    
    // Step 2: Parse the dictionary
    const pinyinDict = await parseCedictFile(gzFilename);
    
    // Step 3: Save to JSON
    await saveToJson(pinyinDict);
    
    console.log();
    console.log('Successfully created cedict.json');
    console.log(`Total entries: ${Object.keys(pinyinDict).length}`);
    
    // Clean up the downloaded file
    try {
      fs.unlinkSync(gzFilename);
      console.log(`Cleaned up temporary file: ${gzFilename}`);
    } catch (err) {
      console.log(`Could not clean up temporary file: ${err.message}`);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  
  console.log();
  console.log(`Finished at: ${new Date().toISOString()}`);
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { downloadCedict, parseCedictFile, saveToJson, parsePinyin };