# -*- coding: utf-8 -*-
import logging
import json
import azure.functions as func
from azure.storage.blob import BlockBlobService
from azure.storage.blob import PublicAccess
from ..share_code import fileSystem


def main(req: func.HttpRequest) -> str:
    '''
    Upload a json file!
    '''
    #json str need to be upload!
    str1 = ""
    upload_path = ""
    if req.method == "POST":
        try:
            #container = req.params.get('container')
            #fileName = req.params.get('filename')
            req_body = req.get_json()
            str1 = json.dumps(req_body)
            upload_path = req.params.get('path')
            if upload_path is None:
                return func.HttpResponse(
                    'Wrong in path parameter! You should give the path!',
                    status_code=400
                )
        except:
            return func.HttpResponse(
                "The paras is wrong! you should give the container and filename to save the json!",
                status_code=400
            )
    elif req.method == "GET":
        return func.HttpResponse('Well, please use POST to upload the json file!')
    else:
        pass

    #Upload the json in req_body to Azure storage as {filename}.json in {container}
    try:
        upload_string = str1 if str1 != "" else "POST give nothing! You may do wrong Request"
        file_name = 'label.json'
        fileSystem.upload_string(upload_string, f'{upload_path}/{file_name}')
    except:
        return func.HttpResponse(
            'Upload failed, please try again!',
            status_code=400
            )


    #tmp = fileSystem.openFileAsBytesIO(f'{upload_path}/{fileName}')
    return func.HttpResponse(
        'We have get the data: ' + str1
    )

