import logging
import json
import os
import pathlib

import azure.functions as func
from io import BytesIO

from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContainerClient
from azure.storage.blob import BlobClient
from azure.storage.blob import PublicAccess
from azure.storage.blob import StorageErrorCode

from .anlysis import analyze_json

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    
    pro_name = req.params.get('path')
    if pro_name is None:
        return func.HttpResponse(
            "'path' parameter is needed!",
            status_code=400
        )

    
    analyze_json(path=pro_name)

    return func.HttpResponse(
        "Get it",
        status_code=200
    )