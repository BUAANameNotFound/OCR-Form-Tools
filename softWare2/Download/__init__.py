import logging
import json
import urllib.request, urllib.parse, urllib.error, base64
import http.client
import requests
import datetime
import random

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


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    
    pro_name = req.params.get('path')
    if pro_name is None:
        return func.HttpResponse(
            " 'path' parameter is needed!",
            status_code=400
        )

    #downLoad
    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    tmp = container_service.get_blob_client(f'ly/1Map.html')
    
    text = tmp.download_blob().readall()


    return func.HttpResponse(
            body=text,
            status_code=200
    )



def data_string(data_list):
    '''处理地图，返回HTML地图，（随机算法）'''
    length = len(data_list)
    value = [0, 0, 0, 0, 0, 0, 0, 0]
    loop = 1
    while loop < length:
        loop += 1
        rand = random.randint(0, 7)
        value[rand] += 1
    attr = ["China", "Brazil", "Russia", "United States", "Mexico", "Australia", "India", "Algeria"]
    dic = {}
    length = len(attr)
    for i in range(length):
        if value[i] != 0:
            dic[attr[i]] = value[i]
    # return dictionary
    return dic
