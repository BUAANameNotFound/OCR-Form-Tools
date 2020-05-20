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

#CONNECTION_STR = 'DefaultEndpointsProtocol=https;AccountName=lyniupi;AccountKey=1Y5H3obB3kT4NtMIE1babykABwW0LXFxyaJ43MBONcGmaxzt8RPCsmdmYBrhrR9QBySv9oYHFSsXyDKWHz8p3Q==;EndpointSuffix=core.windows.net'

#STABLE_URL='https://lyceshi.blob.core.windows.net'
#STABLE_CREDENTIAL='PcrYp+YILDxt54rzcPEPIk3Lhv9WXC9w64Ws7rP27TJEIyDdE4aa/g2mir4u6/PmuWqnbLtb0Zo3ny33wwh6EQ=='

CONNECTION_STR = 'DefaultEndpointsProtocol=https;AccountName=lyceshi;AccountKey=PcrYp+YILDxt54rzcPEPIk3Lhv9WXC9w64Ws7rP27TJEIyDdE4aa/g2mir4u6/PmuWqnbLtb0Zo3ny33wwh6EQ==;EndpointSuffix=core.windows.net'

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    try:
        container_service.delete_blob('ly/template.pdf')
    except Exception as err:
        logging.info('well, no need to delete!')
    
    try:
        tmp = container_service.get_blob_client('ly/ceshi.json')
    except Exception as err:
        logging.info(f'well, is not exist!')
    with open('tmp/tmp.json', 'r') as f:
        data = f.read()
        tmp.upload_blob(data)
        tmp.append_block(data)
    # container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    # try:
    #     container_service.delete_blob('ly/template.pdf')
    # except Exception as err:
    #     print(err)
    #     logging.info('well, no need to delete!')
    # tmp = container_service.get_blob_client('ly/template.pdf')
    # #with open(r'tmp/rich_Invoice_sample.pdf', 'rb') as data:
    #     #service.upload_blob('ly/template.pdf', data)
    # tmp.upload_blob(req.get_body())
    # #    pass
    # # tmp = service.get_blob_client('ly/label.json')
    # # text = tmp.download_blob()
    # # a = text.readall()

    subscription_key = "5d8c9013ec6540048537058972c695e0"
    endpoint = "https://nashizhendeliupi.cognitiveservices.azure.com"
    entities_url = endpoint + "/text/analytics/v2.1/entities"


    #####处理dxy输出的json
    file_in = "ly/InputFromDxy.json"
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
    write_json("ly/OutputJson2Dxy.json",json_out)



    return func.HttpResponse(
            "Get it",
            status_code=200
    )


def read_json(name):
    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    # try:
    #     container_service.delete_blob('ly/template.pdf')
    # except Exception as err:
    #     print(err)
    #     logging.info('well, no need to delete!')
    try:
        tmp = container_service.get_blob_client(name)
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

def write_json(name, arr):
    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    try:
        container_service.delete_blob('ly/template.pdf')
    except Exception as err:
        logging.info('well, no need to delete!')
    
    try:
        tmp = container_service.get_blob_client(name)
    except Exception as err:
        logging.info(f'well, {name} is not exist!')
    tmp.upload_blob(json.dumps(arr))
    