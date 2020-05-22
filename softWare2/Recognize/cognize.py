'''
The module is used for file operation in Azure Storage
'''
import logging
import json
import urllib.request, urllib.parse, urllib.error, base64
import http.client
import requests

import azure.functions as func
from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContainerClient
from azure.storage.blob import BlobClient
from azure.storage.blob import PublicAccess
from azure.storage.blob import StorageErrorCode

#STABLE_URL = 'https://lyniupi.blob.core.windows.net'
#STABLE_CREDENTIAL = '1Y5H3obB3kT4NtMIE1babykABwW0LXFxyaJ43MBONcGmaxzt8RPCsmdmYBrhrR9QBySv9oYHFSsXyDKWHz8p3Q=='

CONNECTION_STR = 'DefaultEndpointsProtocol=https;AccountName=lyniupi;AccountKey=1Y5H3obB3kT4NtMIE1babykABwW0LXFxyaJ43MBONcGmaxzt8RPCsmdmYBrhrR9QBySv9oYHFSsXyDKWHz8p3Q==;EndpointSuffix=core.windows.net'

#STABLE_URL='https://lyceshi.blob.core.windows.net'
#STABLE_CREDENTIAL='PcrYp+YILDxt54rzcPEPIk3Lhv9WXC9w64Ws7rP27TJEIyDdE4aa/g2mir4u6/PmuWqnbLtb0Zo3ny33wwh6EQ=='

#CONNECTION_STR = 'DefaultEndpointsProtocol=https;AccountName=lyceshi;AccountKey=PcrYp+YILDxt54rzcPEPIk3Lhv9WXC9w64Ws7rP27TJEIyDdE4aa/g2mir4u6/PmuWqnbLtb0Zo3ny33wwh6EQ==;EndpointSuffix=core.windows.net'

def recognize(path):

    #####处理dxy输出的json
    file_in = "test.json"
    docs = read_json(path, file_in)
    

    for (key, value) in docs.items():
        json_out = dealOne(value)
        write_json(path, json_out['document'], json_out)



def read_json(path, name):
    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    # try:
    #     container_service.delete_blob('ly/template.pdf')
    # except Exception as err:
    #     print(err)
    #     logging.info('well, no need to delete!')
    try:
        tmp = container_service.get_blob_client(f'{path}/{name}')
    except Exception as err:
        logging.info(f'well, {name} is not exist!')
    #with open(r'tmp/rich_Invoice_sample.pdf', 'rb') as data:
        #service.upload_blob('ly/template.pdf', data)
    text = tmp.download_blob()
    data = text.readall()
    return json.loads(data)
    #    pass
    # tmp = service.get_blob_client('ly/label.json')
    # text = tmp.download_blob()
    # a = text.readall()

def write_json(path, name, arr):
    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    try:
        container_service.delete_blob(f'{path}/type2/{name}.labels.json')
    except Exception:
        logging.info('well, no need to delete!')

    tmp = container_service.get_blob_client(f'{path}/type2/{name}.labels.json')
    tmp.upload_blob(json.dumps(arr))
    

def dealOne(json_in):
    subscription_key = "5d8c9013ec6540048537058972c695e0"
    endpoint = "https://nashizhendeliupi.cognitiveservices.azure.com"
    entities_url = endpoint + "/text/analytics/v2.1/entities"
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
                i['label'] = "ADDRESS"
            elif 'Quantity' in listforattribute[id]['entity']:
                i['label'] = "CURRENCY"
            elif 'Phone_Number' in listforattribute[id]['entity']:
                i['label'] = "NUMBER"
            elif 'DateTime' in listforattribute[id]['entity']:
                i['label'] = "DATE"
            elif 'Person' in listforattribute[id]['entity']:
                i['label'] = "NAME"
            elif 'Email' in listforattribute[id]['entity']:
                i['label'] = "EMAIL"
            else:
                i['label'] = "OTHER"
        id += 1

    #print(labels)
    json_out['labels']  = labels
    return json_out