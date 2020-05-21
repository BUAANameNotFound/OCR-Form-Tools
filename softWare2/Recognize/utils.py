import json
import os
import logging

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


def find_json_file(path):
    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    tmp = container_service.list_blobs(name_starts_with=f'{path}/type2', )
    filenames = []
    for i in tmp:
        name = i.name
        back = name[name.find('.')+1:]
        if back == "pdf.ocr.json":
            filenames.append(name[name.find('/')+1:])
    return filenames

def readjson(path, name):
    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    tmp = container_service.get_blob_client(f'{path}/{name}')
    text = tmp.download_blob().readall()
    content = json.loads(text)
    return content

def get_analyzeResult(item):
    return item["analyzeResult"]

def get_pageResults(item):
    return item["pageResults"]

def get_readResults(item):
    return item["readResults"]

def get_lines(item):
    return item["lines"]

def get_tables(item, page=0):
    return item[page]["tables"]

def get_cells(item):
    return item["cells"]

def get_text(item):
    return item["text"]

def get_boundingBox(item):
    return item["boundingBox"]

def compare_text(texta, textb):
    return texta == textb

def compare_boundingbox(boundingboxa, boundingboxb):
    for i in range(8):
        if boundingboxa[i] != boundingboxb[i]:
            return False
    return True

def compare_xposition(itema, itemb):
    ayrightup = itema[1][3]
    byleftup = itemb[1][1]
    axleftup = itema[1][0]
    axrightup = itema[1][2]
    axgap = axrightup - axleftup
    bxleftup = itemb[1][0]
    bxrightup = itemb[1][2]
    bxgap = bxrightup - bxleftup
    alen = len(itema[0])
    blen = len(itemb[0])
    aword = axgap / alen
    bword = bxgap / blen
    delta = 0.03
    '''
    if itema == ('GA', (1.7679, 2.419, 2.0288, 2.419, 2.0288, 2.5529, 1.7679, 2.5529)):
        print(axrightup + 1.4 * aword)
        print(bxleftup)
        print(itemb)
    '''
    #if abs(axrightup + aword - bxleftup) < delta:
    if abs(ayrightup - byleftup) < delta and abs(aword - bword) < delta and abs(axrightup + 1.4 * aword - bxleftup) < delta:
        return True
    return False

def compare_yposition(itema, itemb):
    axleftdown = itema[1][-2]
    bxleftup = itemb[1][0]
    ayleftup = itema[1][1]
    ayleftdown = itema[1][-1]
    aygap = ayleftdown - ayleftup
    byleftup = itemb[1][1]
    byleftdown = itemb[1][-1]
    bygap = byleftdown - byleftup
    delta = 0.04
    '''
    if itema == ('9468 Pendergast St.', (0.4372, 2.0589, 2.8013, 2.0574, 2.8013, 2.2251, 0.4372, 2.1947)):
        print(aygap)
        print(bygap)
        print(0.58 * aygap)
        print(itemb)
    
    if abs(aygap - bygap) < delta:
    '''
    if axleftdown > bxleftup and abs(axleftdown - bxleftup) < delta and abs(aygap - bygap) < delta and abs(ayleftdown  + 0.58 * aygap - byleftup) < delta:
        return True
    return False

def outjson(path, name, content):
    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    try:
        container_service.delete_blob(f'{path}/{name}')
    except Exception:
        logging.info('well, no need to delete!')
    
    tmp = container_service.get_blob_client(f'{path}/{name}')
    tmp.upload_blob(json.dumps(content))