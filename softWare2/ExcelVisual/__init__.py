'''
The module is For excel visual
'''
import logging
import json
import os
import pathlib
import tempfile
from io import BytesIO

import azure.functions as func
from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContainerClient
from azure.storage.blob import BlobClient
from azure.storage.blob import PublicAccess
from azure.storage.blob import StorageErrorCode
from .handle_json import read_single_json, read_single_json2
from .handle_excel import new_excel, write_pdf_data, write_pdf_names
from .show_excel import read_excel

#CONNECTION_STR = 'DefaultEndpointsProtocol=https;AccountName=lyceshi;\
# AccountKey=PcrYp+YILDxt54rzcPEPIk3Lhv9WXC9w64Ws7rP27TJEIyDdE4aa/g2mir\
# 4u6/PmuWqnbLtb0Zo3ny33wwh6EQ==;EndpointSuffix=core.windows.net'
CONNECTION_STR = 'DefaultEndpointsProtocol=https;AccountName=lyniupi;\
    AccountKey=1Y5H3obB3kT4NtMIE1babykABwW0LXFxyaJ43MBONcGmaxzt8RPCs\
        mdmYBrhrR9QBySv9oYHFSsXyDKWHz8p3Q==;EndpointSuffix=core.windows.net'

def main(req: func.HttpRequest) -> func.HttpResponse:
    '''
    main function
    '''
    logging.info('Python HTTP trigger function processed a request.')
    try:
        pro_name = req.params.get('path')
    except Exception:
        return func.HttpResponse(
            "'path' parameter is needed!",
            status_code=400
        )

    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR,
                                                               container_name='wudi')
    tmp = container_service.list_blobs(name_starts_with=f'{pro_name}/type4')
    filenames = []
    for i in tmp:
        filenames.append(i.name)

    #NUM = 2
    #PATH = f"tmp/wow.xlsx"

    pdf_names = []
    labels_name = []
    data_list = []

    for filename in filenames:
        #FILENAME = 'ly/genPdf' + str(i + 1) + '.pdf.labels.json'
        label_string_list = read_single_json2(filename)
        pdf_names.append(label_string_list[0])
        labels_name.append(label_string_list[1])
        data_list.append(label_string_list[2])

    #tempfile_path = tempfile.gettempdir()
    file_point = tempfile.NamedTemporaryFile()

    new_excel(file_point.name)
    write_pdf_names(pdf_names, file_point.name)
    write_pdf_data(labels_name, data_list, file_point.name)

    # with open(PATH, 'wb') as f:
    #     f.truncate()
    # new_excel(PATH)
    # write_pdf_names(pdf_names, PATH)
    # write_pdf_data(labels_name, data_list, PATH)

    try:
        container_service.delete_blob(f'{pro_name}/wow.xlsx')
    except Exception:
        logging.info('well, no need to delete!')

    tmp = container_service.get_blob_client(f'{pro_name}/wow.xlsx')
    with open(file_point.name, 'rb') as afile:
        data = afile.read()
        tmp.upload_blob(data)

    # with open(PATH, 'rb') as f:
    #     data = f.read()
    #     tmp.upload_blob(data)

    #read_excel(PATH)


    return func.HttpResponse(body=data, status_code=20)
