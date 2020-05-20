import jsonpath as jsonpath
import requests
# pprint is used to format the JSON response
from pprint import pprint
import json

def read_json(name):
    with open(name, 'rt', encoding="utf-8") as f:
        cr = json.load(f)
    f.close()
    return cr

def write_json(name, arr):
    with open(name, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(arr, f, indent = 1)
    f.close()
    return


def get_json_value(json_data, key_name):
    '''获取到json中任意key的值,结果为list格式'''
    key_value = jsonpath.jsonpath(json_data, '$..{key_name}'.format(key_name=key_name))
    # key的值不为空字符串或者为empty（用例中空固定写为empty）返回对应值，否则返回empty
    return key_value


subscription_key = "5d8c9013ec6540048537058972c695e0"
endpoint = "https://nashizhendeliupi.cognitiveservices.azure.com"
entities_url = endpoint + "/text/analytics/v2.1/entities"

# documents = {"documents": [
#     {"id": "1", "text": "1020 Enterprise Way Sunnayvale, CA 87659"},
#     {"id": "2", "text": "Microsoft was founded by Bill Gates and Paul Allen on April 4, 1975, "
#                         "to develop and sell BASIC interpreters for the Altair 8800."}
# ]}

# headers = {"Ocp-Apim-Subscription-Key": subscription_key}
# response = requests.post(entities_url, headers=headers, json=documents)
# entities = response.json()
# pprint(entities)
# pprint(documents)

#####处理从OCR识别的结果---ocr.json
# file_in = "genPdf1.pdf.ocr.json"
# json_in = read_json(file_in)
# readResult = json_in["analyzeResult"]["readResults"]
# print(type(readResult))
# x = readResult[0]
# lines = x["lines"]
# print(lines)
# #print(type(lines))
#
# #print(type(documents["documents"])) list
# print(documents["documents"][0])
#
# index = 1;
# listfordoc = [] #调用api所需格式中的list
# for i in lines:
#     print(i['text'])
#     dict = {"id": index ,"text":i['text']}
#     index += 1
#     listfordoc.append(dict)
#     print(dict)
#
# print(list)
# doc = {"documents":listfordoc}
# print(doc)


#####处理dxy输出的json
file_in = "InputFromDxy.json"
json_in = read_json(file_in)
readResult = json_in["labels"]

index = 1;
listfordoc = [] #调用api所需json中的list
for i in readResult:
    for j in i['value']:
        dict = {"id": index ,"text":j['text']}
    index += 1
    listfordoc.append(dict)
    #print(dict)

doc = {"documents":listfordoc} #传入接口的文件

headers = {"Ocp-Apim-Subscription-Key": subscription_key}
response = requests.post(entities_url, headers=headers, json=doc)
entities = response.json()
#pprint(entities)
#write_json("outtest.json",entities)

entity = entities['documents'] #list类型 每个id对应的识别结果
listforattribute = []
for k in entity:    #k为dict
    str = ''
    for j in k['entities']:
        str = str + j['type']
    dict = {"id":k['id'],"entity":str}
    listforattribute.append(dict)
    #print(dict)

json_out = json_in
labels = json_out["labels"]

id = 0
for i in labels:
    for j in i['value']:
        if 'Location' in listforattribute[id]['entity']:
            j['text'] = "ADDRESS"
        elif 'Quantity' in listforattribute[id]['entity']:
            j['text'] = "CURRENCY"
        elif 'Phone_Number' in listforattribute[id]['entity']:
            j['text'] = "NUMBER"
        elif 'DateTime' in listforattribute[id]['entity']:
            j['text'] = "DATE"
        elif 'Person' in listforattribute[id]['entity']:
            j['text'] = "NAME"
        elif 'Email' in listforattribute[id]['entity']:
            j['text'] = "EMAIL"
        else:
            j['text'] = "OTHER"
    id += 1

#print(labels)
json_out = {"document":"test.pdf","labels":labels}
write_json("OutputJson2Dxy.json",json_out)


