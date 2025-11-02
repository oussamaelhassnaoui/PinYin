// Pinyin to Chinese conversion functionality
// Using CC-CEDICT dictionary for comprehensive conversion

document.addEventListener('DOMContentLoaded', function() {
    const pinyinInput = document.getElementById('pinyin-input');
    const convertButton = document.getElementById('convert-btn');
    const chineseOutput = document.getElementById('chinese-output');
    const copyButton = document.getElementById('copy-btn');
    const googleButton = document.getElementById('google-btn');
    const youtubeButton = document.getElementById('youtube-btn');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const pinyinSuggestionInput = document.getElementById('pinyin-suggestion-input');
    const suggestionsDisplay = document.getElementById('suggestions-display');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    
    // Load the CC-CEDICT dictionary
    let cedict = {};
    
    // Check for saved theme preference or default to light theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
    } else {
        themeIcon.textContent = '🌙';
    }
    
    // Theme toggle functionality with enhanced transition
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        
        // Add transition class for smooth theme switching
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
        
        // Update theme icon with animation
        if (document.body.classList.contains('dark-theme')) {
            themeIcon.textContent = '☀️';
            themeIcon.style.transform = 'rotate(180deg)';
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.textContent = '🌙';
            themeIcon.style.transform = 'rotate(0deg)';
            localStorage.setItem('theme', 'light');
        }
        
        // Add animation to the icon
        themeIcon.style.transition = 'transform 0.3s ease, font-size 0.3s ease';
    });
    
    // Fetch the dictionary file
    fetch('cedict.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Dictionary file not found');
            }
            return response.json();
        })
        .then(data => {
            cedict = data;
            console.log(`Loaded CC-CEDICT with ${Object.keys(cedict).length} entries`);
            // Update the instructions to show that the full dictionary is loaded
            const instructions = document.querySelector('.instructions ul');
            if (instructions) {
                instructions.innerHTML = `
                    <li>Type Pinyin with tone numbers (e.g., "ni3 hao3")</li>
                    <li>Or type Pinyin without tones (e.g., "ni hao")</li>
                    <li>Supports ${Object.keys(cedict).length.toLocaleString()} Chinese words and phrases</li>
                    <li>Powered by the CC-CEDICT dictionary</li>
                    <li>Real-time suggestions as you type</li>
                `;
            }
        })
        .catch(error => {
            console.error('Failed to load CC-CEDICT dictionary:', error);
            // Show error to user with instructions for running locally
            chineseOutput.innerHTML = `
                <p class="placeholder">
                    Dictionary loading failed. This is normal when opening the file directly.<br>
                    For full functionality, please run with a local server:<br>
                    1. Open terminal in this folder<br>
                    2. Run: node server.js<br>
                    3. Visit: http://localhost:8000<br>
                    <br>
                    Using limited vocabulary for now.
                </p>
            `;
            
            // Provide a basic fallback dictionary
            cedict = {
                "ni": ["你 (you)", "泥 (mud)", "铌 (niobium)", "伱 (you, informal)", "㝵 (to obtain)"],
                "hao": ["好 (good)", "号 (number)", "毫 (milli-)", "郝 (surname)"],
                "wo": ["我 (I, me)", "窝 (nest)", "挝 (to beat)", "倭 (dwarf, Japan)"],
                "men": ["们 (plural suffix)", "门 (door)", "闷 (depressed)"],
                "zhong": ["中 (middle)", "种 (type)", "重 (heavy)"],
                "guo": ["国 (country)", "过 (to pass)", "果 (fruit)"],
                "shi": ["是 (to be)", "十 (ten)", "时 (time)"],
                "jie": ["界 (world)", "结 (to tie)", "姐 (elder sister)"],
                "ai": ["爱 (love)", "艾 (moxa)", "碍 (to hinder)"],
                "xie": ["谢 (to thank)", "些 (some)", "鞋 (shoes)"],
                "dui": ["对 (correct)", "队 (team)", "堆 (pile)"],
                "bu": ["不 (not)", "布 (cloth)", "步 (step)"],
                "qi": ["七 (seven)", "起 (to rise)", "气 (air)"],
                "mei": ["没 (not have)", "美 (beautiful)", "煤 (coal)"],
                "guan": ["关 (to close)", "管 (pipe)", "官 (official)"],
                "xi": ["西 (west)", "洗 (to wash)", "戏 (game)"],
                "qing": ["请 (please)", "情 (feeling)", "清 (clear)"],
                "wen": ["问 (to ask)", "文 (text)", "温 (warm)"],
                "jiao": ["叫 (to call)", "教 (to teach)", "觉 (to sleep)"],
                "bei": ["北 (north)", "被 (by)", "背 (back)"],
                "jing": ["京 (capital)", "经 (pass through)", "精 (essence)"],
                "shang": ["上 (up)", "商 (merchant)", "伤 (wound)"],
                "hai": ["海 (sea)", "还 (still)", "孩 (child)"],
                // Multi-syllable phrases - these should take priority
                "woaini": ["我爱你 (I love you)"],
                "wo ai ni": ["我爱你 (I love you)"],
                "ni hao": ["你好 (hello)"],
                "xiexie": ["谢谢 (thank you)"],
                "xie xie": ["谢谢 (thank you)"],
                "duibuqi": ["对不起 (sorry)"],
                "dui bu qi": ["对不起 (sorry)"],
                "meiguanxi": ["没关系 (it's okay)"],
                "mei guan xi": ["没关系 (it's okay)"],
                "qingwen": ["请问 (excuse me)"],
                "qing wen": ["请问 (excuse me)"],
                "wojiao": ["我叫 (my name is)"],
                "wo jiao": ["我叫 (my name is)"],
                "zhongguo": ["中国 (China)"],
                "zhong guo": ["中国 (China)"],
                "beijing": ["北京 (Beijing)"],
                "bei jing": ["北京 (Beijing)"],
                "shanghai": ["上海 (Shanghai)"],
                "shang hai": ["上海 (Shanghai)"]
            };
        });
    
    // Function to normalize Pinyin by removing spaces and tone marks
    function normalizePinyin(pinyin) {
        return pinyin.toLowerCase().replace(/\s+/g, ' ').replace(/[0-9]/g, '');
    }
    
    // Function to extract Chinese characters and meaning from dictionary entry
    function parseDictionaryEntry(entry) {
        // Entry format: "汉字 (meaning)"
        const match = entry.match(/^([^\s\(]+)\s*\(([^)]+)\)/);
        if (match) {
            return {
                chinese: match[1],
                pinyin: '', // We don't have pinyin in this format
                meaning: match[2]
            };
        }
        // Fallback if format is different
        const parts = entry.split(' ');
        return {
            chinese: parts[0] || entry,
            pinyin: '',
            meaning: parts.slice(1).join(' ').replace(/[()]/g, '') || 'No meaning available'
        };
    }
    
    // Function to find suggestions for Pinyin input
    function findSuggestions(input) {
        const normalized = normalizePinyin(input).trim();
        if (!normalized) return [];
        
        // Look for exact matches first
        if (cedict[normalized]) {
            return cedict[normalized].slice(0, 10); // Limit to 10 suggestions
        }
        
        // If no exact match, look for partial matches
        const suggestions = [];
        const keys = Object.keys(cedict);
        
        // Find entries that start with the input
        for (const key of keys) {
            if (key.startsWith(normalized) && suggestions.length < 10) {
                suggestions.push(...cedict[key]);
                if (suggestions.length >= 10) break;
            }
        }
        
        // If still not enough, find entries that contain the input
        if (suggestions.length < 10) {
            for (const key of keys) {
                if (key.includes(normalized) && !key.startsWith(normalized) && suggestions.length < 10) {
                    suggestions.push(...cedict[key]);
                    if (suggestions.length >= 10) break;
                }
            }
        }
        
        return suggestions.slice(0, 10); // Limit to 10 suggestions
    }
    
    // Function to display suggestions
    function displaySuggestions(suggestions) {
        if (suggestions.length === 0) {
            suggestionsDisplay.innerHTML = '<p>No suggestions found</p>';
            suggestionsContainer.classList.remove('hidden');
            return;
        }
        
        let suggestionsHTML = '';
        suggestions.forEach((entry, index) => {
            const parsed = parseDictionaryEntry(entry);
            const number = index < 9 ? index + 1 : (index === 9 ? 0 : '');
            suggestionsHTML += `
                <div class="suggestion-item">
                    <span class="suggestion-number">${number}.</span>
                    <span style="font-size:22px;">
                        <a href="javascript:void(0)" onclick="event.preventDefault(); addSuggestionToInput('${parsed.chinese.replace(/'/g, "\\'")}');">
                            ${parsed.chinese}
                        </a>
                    </span>
                </div>
            `;
        });
        
        suggestionsDisplay.innerHTML = suggestionsHTML;
        suggestionsContainer.classList.remove('hidden');
    }
    
    // Function to add suggestion to input
    window.addSuggestionToInput = function(chineseChar) {
        pinyinInput.value += chineseChar;
        pinyinInput.focus();
        convertInput();
        suggestionsContainer.classList.add('hidden');
    };
    
    // Function to convert Pinyin to Chinese using phrase matching
    function convertPinyinToChinese(pinyin) {
        // Normalize input: convert to lowercase and remove extra spaces
        const normalized = normalizePinyin(pinyin).trim();
        
        // First, check if the entire phrase exists as a multi-syllable entry
        if (cedict[normalized]) {
            // Return the first entry's Chinese characters
            const firstEntry = cedict[normalized][0];
            const chineseChars = firstEntry.split(' ')[0];
            return chineseChars;
        }
        
        // Handle multi-line input by processing each line separately
        const lines = normalized.split('\n');
        const convertedLines = [];
        
        for (const line of lines) {
            const cleanLine = line.trim().replace(/\s+/g, ' ');
            if (!cleanLine) {
                convertedLines.push('');
                continue;
            }
            
            // Split by spaces to get individual phrases
            const phrases = cleanLine.split(' ');
            const convertedPhrases = [];
            
            for (const phrase of phrases) {
                const cleanPhrase = normalizePinyin(phrase);
                if (!cleanPhrase) continue;
                
                // Try to find the best match using longest match first
                let result = '';
                let i = 0;
                
                while (i < cleanPhrase.length) {
                    let matched = false;
                    
                    // Try to match the longest possible phrases first
                    const sortedKeys = Object.keys(cedict).sort((a, b) => b.length - a.length);
                    
                    for (const key of sortedKeys) {
                        if (i + key.length <= cleanPhrase.length && 
                            cleanPhrase.substring(i, i + key.length) === key) {
                            // Take the first entry and extract just the Chinese characters
                            const firstEntry = cedict[key][0];
                            const chineseChars = firstEntry.split(' ')[0];
                            result += chineseChars;
                            i += key.length;
                            matched = true;
                            break;
                        }
                    }
                    
                    // If no match found, try syllable matching with our fallback dictionary
                    if (!matched) {
                        // Try common syllables
                        const syllables = ['a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'er',
                                          'ba', 'pa', 'ma', 'fa', 'da', 'ta', 'na', 'la', 'ga', 'ka', 'ha', 'za', 'ca', 'sa',
                                          'zha', 'cha', 'sha', 'ra',
                                          'bi', 'pi', 'mi', 'di', 'ti', 'ni', 'li', 'gi', 'ki', 'hi', 'ji', 'qi', 'xi',
                                          'bo', 'po', 'mo', 'fo', 'de', 'te', 'ne', 'le', 'ge', 'ke', 'he', 'ze', 'ce', 'se',
                                          'zhe', 'che', 'she', 're',
                                          'bu', 'pu', 'mu', 'fu', 'du', 'tu', 'nu', 'lu', 'gu', 'ku', 'hu', 'zu', 'cu', 'su',
                                          'zhu', 'chu', 'shu', 'ru',
                                          'wa', 'ya', 'wu', 'yu', 'we', 'ye', 'wo', 'yo', 'wa', 'ya',
                                          'bai', 'pai', 'mai', 'dai', 'tai', 'nai', 'lai', 'gai', 'kai', 'hai', 'zai', 'cai', 'sai',
                                          'zhai', 'chai', 'shai',
                                          'bei', 'pei', 'mei', 'fei', 'dei', 'tei', 'nei', 'lei', 'gei', 'kei', 'hei', 'zei', 'sei',
                                          'zhei', 'shei',
                                          'bao', 'pao', 'mao', 'dao', 'tao', 'nao', 'lao', 'gao', 'kao', 'hao', 'zao', 'cao', 'sao',
                                          'zhao', 'chao', 'shao', 'rao',
                                          'ban', 'pan', 'man', 'fan', 'dan', 'tan', 'nan', 'lan', 'gan', 'kan', 'han', 'zan', 'can', 'san',
                                          'zhan', 'chan', 'shan', 'ran',
                                          'bang', 'pang', 'mang', 'fang', 'dang', 'tang', 'nang', 'lang', 'gang', 'kang', 'hang', 'zang', 'cang', 'sang',
                                          'zhang', 'chang', 'shang', 'rang',
                                          'bia', 'pia', 'mia', 'dia', 'nia', 'lia', 'jia', 'qia', 'xia',
                                          'bie', 'pie', 'mie', 'die', 'tie', 'nie', 'lie', 'jie', 'qie', 'xie',
                                          'biao', 'piao', 'miao', 'diao', 'tiao', 'niao', 'liao', 'jiao', 'qiao', 'xiao',
                                          'bin', 'pin', 'min', 'nin', 'lin', 'jin', 'qin', 'xin',
                                          'bing', 'ping', 'ming', 'ding', 'ting', 'ling', 'jing', 'qing', 'ying',
                                          'wu', 'du', 'tu', 'nu', 'lu', 'gu', 'ku', 'hu', 'zu', 'cu', 'su', 'ru',
                                          'ai', 'uai', 'ao', 'iao', 'ou', 'iou',
                                          'an', 'ian', 'uan', 'van',
                                          'ang', 'iang', 'uang',
                                          'eng', 'ing', 'ying',
                                          'ong', 'iong',
                                          'er', 'n', 'ng', 'm'];
                        
                        let syllableMatched = false;
                        // Sort by length descending to match longer syllables first
                        const sortedSyllables = syllables.sort((a, b) => b.length - a.length);
                        
                        for (const syllable of sortedSyllables) {
                            if (i + syllable.length <= cleanPhrase.length && 
                                cleanPhrase.substring(i, i + syllable.length) === syllable) {
                                // Check if syllable exists in dictionary
                                if (cedict[syllable]) {
                                    const firstEntry = cedict[syllable][0];
                                    const chineseChars = firstEntry.split(' ')[0];
                                    result += chineseChars;
                                    i += syllable.length;
                                    syllableMatched = true;
                                    break;
                                }
                            }
                        }
                        
                        if (!syllableMatched) {
                            // If still no match, just move one character forward
                            result += cleanPhrase[i];
                            i++;
                        }
                    }
                }
                
                convertedPhrases.push(result);
            }
            
            convertedLines.push(convertedPhrases.join(' '));
        }
        
        return convertedLines.join('\n');
    }
    
    // Function to convert the current input
    function convertInput() {
        const inputText = pinyinInput.value.trim();
        
        if (inputText) {
            addConversionAnimation();
            
            // Simulate processing time for better UX
            setTimeout(() => {
                const chineseText = convertPinyinToChinese(inputText);
                chineseOutput.innerHTML = `<p>${chineseText}</p>`;
                removeConversionAnimation();
                addResultAnimation();
            }, 100);
        } else {
            chineseOutput.innerHTML = '<p class="placeholder">Please enter some Pinyin text</p>';
            addResultAnimation();
        }
    }
    
    // Function to add conversion animation
    function addConversionAnimation() {
        chineseOutput.classList.add('converting');
    }
    
    // Function to remove conversion animation
    function removeConversionAnimation() {
        chineseOutput.classList.remove('converting');
    }
    
    // Function to add result animation
    function addResultAnimation() {
        chineseOutput.classList.add('result-enter');
        setTimeout(() => {
            chineseOutput.classList.remove('result-enter');
        }, 400);
    }
    
    // Copy button functionality
    copyButton.addEventListener('click', function() {
        const textToCopy = chineseOutput.innerText.trim();
        if (textToCopy && !textToCopy.includes('Chinese characters will appear here') && !textToCopy.includes('Please enter some Pinyin text')) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    // Show visual feedback
                    const originalText = copyButton.textContent;
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    alert('Failed to copy text. Please try again.');
                });
        } else {
            alert('No text to copy');
        }
    });
    
    // Google search button functionality
    googleButton.addEventListener('click', function() {
        const textToSearch = chineseOutput.innerText.trim();
        if (textToSearch && !textToSearch.includes('Chinese characters will appear here') && !textToSearch.includes('Please enter some Pinyin text')) {
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(textToSearch)}`;
            window.open(googleUrl, '_blank');
        } else {
            alert('No text to search');
        }
    });
    
    // YouTube search button functionality
    youtubeButton.addEventListener('click', function() {
        const textToSearch = chineseOutput.innerText.trim();
        if (textToSearch && !textToSearch.includes('Chinese characters will appear here') && !textToSearch.includes('Please enter some Pinyin text')) {
            const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(textToSearch)}`;
            window.open(youtubeUrl, '_blank');
        } else {
            alert('No text to search');
        }
    });
    
    // Event listener for the convert button
    convertButton.addEventListener('click', convertInput);
    
    // Real-time suggestion system
    let suggestionTimeout;
    pinyinSuggestionInput.addEventListener('input', function() {
        clearTimeout(suggestionTimeout);
        suggestionTimeout = setTimeout(() => {
            const inputText = pinyinSuggestionInput.value.trim();
            
            if (inputText) {
                const suggestions = findSuggestions(inputText);
                displaySuggestions(suggestions);
            } else {
                suggestionsContainer.classList.add('hidden');
            }
        }, 200); // Debounce for better performance
    });
    
    // Real-time conversion as user types in main input
    let conversionTimeout;
    pinyinInput.addEventListener('input', function() {
        clearTimeout(conversionTimeout);
        conversionTimeout = setTimeout(() => {
            convertInput();
        }, 200); // Debounce for better performance
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(event) {
        if (!pinyinSuggestionInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
            suggestionsContainer.classList.add('hidden');
        }
    });
});