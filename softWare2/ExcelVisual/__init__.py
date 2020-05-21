import logging
import json
import os
import pathlib
import tempfile
import azure.functions as func
from io import BytesIO

from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContainerClient
from azure.storage.blob import BlobClient
from azure.storage.blob import PublicAccess
from azure.storage.blob import StorageErrorCode

from .handle_json import read_single_json
from .handle_excel import new_excel, write_pdf_data, write_pdf_names
from .show_excel import read_excel

CONNECTION_STR = 'DefaultEndpointsProtocol=https;AccountName=lyceshi;AccountKey=PcrYp+YILDxt54rzcPEPIk3Lhv9WXC9w64Ws7rP27TJEIyDdE4aa/g2mir4u6/PmuWqnbLtb0Zo3ny33wwh6EQ==;EndpointSuffix=core.windows.net'

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    try:
        pro_name = req.params.get('path')
    except Exception as err:
        return func.HttpResponse(
            "'path' parameter is needed!",
            status_code=400
        )

    NUM = 2
    PATH = f"tmp/wow.xlsx"

    pdf_names = []
    labels_name = []
    data_list = []

    for i in range(NUM):
        FILENAME = 'ly/genPdf' + str(i + 1) + '.pdf.labels.json'
        label_string_list = read_single_json(FILENAME)
        pdf_names.append(label_string_list[0])
        labels_name.append(label_string_list[1])
        data_list.append(label_string_list[2])
    
    

    tempfilePath = tempfile.gettempdir()
    fp = tempfile.NamedTemporaryFile()

    #with open(fp.name, 'wb') as f:
    #   f.truncate()
    new_excel(fp.name)
    write_pdf_names(pdf_names, fp.name)
    write_pdf_data(labels_name, data_list, fp.name)

    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR, container_name='wudi')
    try:
        container_service.delete_blob(f'{pro_name}/wow.xlsx')
    except Exception as err:
        logging.info('well, no need to delete!')

    tmp = container_service.get_blob_client(f'{pro_name}/wow.xlsx')
    with open(fp.name, 'rb') as f:
        tmp.upload_blob(f.read())

    #显示
    #read_excel(PATH)



    return func.HttpResponse(
            "Get it",
            status_code=200
    )