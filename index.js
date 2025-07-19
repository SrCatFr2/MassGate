import axios from 'axios';

const req1 = await axios.post(
  'https://www.solidsignal.com/scs/services/LiveOrder.Line.Service.ss',
  [
    {
      'item': {
        'internalid': 10441,
        'type': 'InvtPart'
      },
      'quantity': 1,
      'options': [
        {
          'cartOptionId': 'custcol_sca_item_ship_cost',
          'itemOptionId': '',
          'label': 'SCA Item Ship Cost',
          'type': 'currency'
        },
        {
          'cartOptionId': 'custcol_ste_tax_item_type',
          'itemOptionId': '',
          'label': 'STE Tax Item Type',
          'type': 'select'
        },
        {
          'cartOptionId': 'custcol_ste_item_tax_schedule',
          'itemOptionId': '',
          'label': 'STE Item Tax Schedules',
          'type': 'select'
        },
        {
          'cartOptionId': 'custcol_ste_tax_item_type_code',
          'itemOptionId': '',
          'label': 'STE Tax Item Type Code',
          'type': 'text'
        },
        {
          'cartOptionId': 'custcol_ste_item_oss_tax_schedule',
          'itemOptionId': '',
          'label': 'STE Item OSS Tax Schedules',
          'type': 'select'
        },
        {
          'cartOptionId': 'custcol_item_brand',
          'itemOptionId': '',
          'label': 'Brand',
          'type': 'select'
        },
        {
          'cartOptionId': 'custcol_accelerator_brand',
          'itemOptionId': '',
          'label': 'Accelerator',
          'type': 'checkbox'
        }
      ],
      'location': '',
      'fulfillmentChoice': 'ship',
      'freeGift': false
    }
  ],
  {
    params: {
      'c': '5639127',
      'n': '2'
    },
    headers: {
      'authority': 'www.solidsignal.com',
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
      'content-type': 'application/json; charset=UTF-8',
      'origin': 'https://www.solidsignal.com',
      'referer': 'https://www.solidsignal.com/belden-1-rg8-u-coaxial-cable-8237',
      'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'x-sc-touchpoint': 'shopping'
    }
  }
);

var cart = req1.data.lines?.[0]?.internalid;
var cookies = req1.headers['set-cookie'];
console.log("Cart ID", cart);
console.log("Cookies has been set");
// ------- [REQUEST TWO] -------

const req2 = await axios.post(
  'https://www.solidsignal.com/scs/services/Account.RegisterAsGuest.Service.ss',
  {
    'email': 'bruneliocarafloja@gmail.com'
  },
  {
    params: {
      'c': '5639127',
      'n': '2'
    },
    headers: {
      'authority': 'www.solidsignal.com',
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
      'content-type': 'application/json; charset=UTF-8',
      'cookie': cookies,
      'origin': 'https://www.solidsignal.com',
      'referer': 'https://www.solidsignal.com/scs/checkout.ssp?is=checkout&_ga=2.131765903.1817039387.1752899002-1877037163.1752899002',
      'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'x-sc-touchpoint': 'checkout'
    }
  }
);

var internalid = req2.data;
console.log("Internal ID:", internalid);
console.log(req2.data)