# -*- coding: utf-8 -*-
'''
The module is used for upload pdf file!
'''
import logging
import json
import datetime
import azure.functions as func
from ..share_code import fileSystem


def main(req: func.HttpRequest) -> str:
    '''
    Upload a pdf file!
    '''
    #json str need to be upload!
    if req.method == "POST":
        try:
            str1 = req.get_body()
            pro_name = req.params.get('path')
            upload_type = req.params.get('type')
            if pro_name is None:
                return func.HttpResponse(
                    'Wrong in path parameter! You should give the path!',
                    status_code=400
                )
            if upload_type is None:
                return func.HttpResponse(
                    'Wrong in type parameter! You should give the type!',
                    status_code=400
                )
        except:
            return func.HttpResponse(
                "The paras is wrong! you should give the container and filename to save the json!",
                status_code=400
            )
    elif req.method == "GET":
        return func.HttpResponse('Well, you should use POST to upload pdf template!')

    #print(str1)
    #Upload the pdf in req_body to Azure storage as template.pdf in {container}
    try:
        suffix = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        up_filename = suffix + '_model.pdf' if upload_type == '2' else 'template.pdf'
        upload_path = pro_name + '/type1' if upload_type == '1' else pro_name + '/type2'
        up_bytes = str1 if str1 != "" else b"POST give nothing! You may do wrong Request!"
        #fileSystem.clear_comsuer_fold(upload_path)
        fileSystem.upload_bytes(up_bytes, f'{upload_path}/{up_filename}')
    except:
        func.HttpResponse(
            'Upload failed, please try again!',
            status_code=400
        )

    try:
        if req.method == "POST":
            return func.HttpResponse(
                'We have get the data!'
            )
        else:
            return func.HttpResponse(
                'Well, you should use POST to upLoad pdf!'
            )
    except:
        return func.HttpResponse(
            "There is something wrong in your Request!",
            status_code=400
        )
