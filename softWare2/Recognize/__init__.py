'''
The module is for recognize
'''
import logging
import json
import os
import pathlib
from io import BytesIO
import azure.functions as func


from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContainerClient
from azure.storage.blob import BlobClient
from azure.storage.blob import PublicAccess
from azure.storage.blob import StorageErrorCode

from .anlysis import analyze_json
from .cognize import recognize

def main(req: func.HttpRequest) -> func.HttpResponse:
    '''
    main function
    '''
    logging.info('Python HTTP trigger function processed a request.')

    pro_name = req.params.get('path')
    if pro_name is None:
        return func.HttpResponse(
            "'path' parameter is needed!",
            status_code=400
        )


    analyze_json(path=pro_name)

    recognize(pro_name)

    return func.HttpResponse(
        "Get it",
        status_code=200
    )
