import axios from 'axios';

export async function resolverCaptcha(apiKey, siteKey = '6LfTjJsnAAAAAGyUGEFYsLpN07urtQwN6QmFje0w', pageUrl = 'https://www.google.com/recaptcha/api2/bframe') {
    try {
        console.log("🤖 Solving captcha...");

        // Enviar captcha
        const requestUrl = `https://api.solvecaptcha.com/in.php?key=${apiKey}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${pageUrl}`;
        const requestResponse = await axios.get(requestUrl);
        
        if (!requestResponse.data.startsWith('OK|')) {
            throw new Error(`Error: ${requestResponse.data}`);
        }

        const taskId = requestResponse.data.substring(3);
        console.log(`📋 Task ID: ${taskId}`);

        // Esperar resultado
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 5000));
            
            const resultUrl = `https://api.solvecaptcha.com/res.php?key=${apiKey}&action=get&id=${taskId}`;
            const resultResponse = await axios.get(resultUrl);
            
            if (resultResponse.data.startsWith('OK|')) {
                const token = resultResponse.data.substring(3);
                console.log('✅ Captcha resuelto');
                return token;
            } else if (resultResponse.data !== "CAPCHA_NOT_READY") {
                throw new Error(`Error: ${resultResponse.data}`);
            }
            
            console.log(`⏳ Intento ${i + 1}/30`);
        }
        
        throw new Error("Timeout");
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return null;
    }
}

// Uso directo:
const token = await resolverCaptcha('29a3424dff1bd989a2835dc9eddf3efd');