
########### Python 3.2 #############
import http.client, urllib.request, urllib.parse, urllib.error, base64

import json

def write_json(name, arr):
    with open(name, 'a', encoding='utf-8', newline='') as f:
        json.dump(arr, f)
    f.close()
    return

headers = {
    # Request headers
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': '5d8c9013ec6540048537058972c695e0',
}

params = urllib.parse.urlencode({
    # Request parameters
    'showStats': True,
    'model-version':'2020-02-01',
})

documents = {"documents": [
    {"id": "1", "text": "1020 Enterprise Way Sunnayvale, CA 87659"},
    {"id": "2", "text": "Microsoft was founded by Bill Gates and Paul Allen on April 4, 1975, "
                        "to develop and sell BASIC interpreters for the Altair 8800."}
]}

dddoc = {
  "documents": [
    {
      "language": "en",
      "id": "1",
      "text": "I had a wonderful trip to Seattle last week."
    },
    {
      "language": "en",
      "id": "2",
      "text": "I work at Microsoft."
    },
    {
      "language": "en",
      "id": "3",
      "text": "I visited Space Needle 2 times."
    }
  ]
}
try:
    #https: // nashizhendeliupi.cognitiveservices.azure.com /
    #conn = http.client.HTTPSConnection('westus.api.cognitive.microsoft.com')

    conn = http.client.HTTPSConnection('nashizhendeliupi.cognitiveservices.azure.com')
    conn.request("POST", "/text/analytics/v3.0-preview.1/entities/recognition/general?%s" % params, json.dumps(documents).encode(), headers)
    response = conn.getresponse()
    data = response.read()
    out = data.decode()
    out = json.loads(out)
    print(out)
    write_json("v3.0out.json",out)
    conn.close()
except Exception as e:
    print("[Errno {0}] {1}".format(e.errno, e.strerror))

####################################