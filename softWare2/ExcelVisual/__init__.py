import logging
import json
import azure.functions as func
from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContainerClient
from azure.storage.blob import BlobClient
from azure.storage.blob import PublicAccess
from azure.storage.blob import StorageErrorCode

from .handle_json import read_single_json
from .handle_excel import new_excel, write_pdf_data, write_pdf_names
from .show_excel import read_excel


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    try:
        pro_name = req.params.get('path')
    except Exception as err:
        return func.HttpResponse(
            "'path' parameter is needed!",
            status_code=400
        )

    NUM = 4
    PATH = f"{pro_name}/wow.xlsx"

    pdf_names = []
    labels_name = []
    data_list = []

    for i in range(NUM):
        FILENAME = 'out' + str(i + 1) + '.json'
        label_string_list = read_single_json(FILENAME)
        pdf_names.append(label_string_list[0])
        labels_name.append(label_string_list[1])
        data_list.append(label_string_list[2])
    new_excel(PATH)
    write_pdf_names(pdf_names, PATH)
    write_pdf_data(labels_name, data_list, PATH)
    
    #显示
    read_excel(PATH)



    return func.HttpResponse(
            "Get it",
            status_code=200
    )