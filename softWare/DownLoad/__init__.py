import logging
import zipfile
import json
import os
import azure.functions as func
from azure.storage.blob import BlockBlobService
from azure.storage.blob import PublicAccess
from ..share_code import fileSystem


def main(req: func.HttpRequest) -> func.HttpResponse:
    '''
    download pdf and Json files
    '''
    logging.info('Download pdf files:')
    #judgeInfo = ''
    try:
        download_path = req.params.get('path')
        if download_path is None:
            return func.HttpResponse(
                "Well, you should give the 'path' parameter!",
                status_code=400
            )
        if not os.path.exists(r'tmp'):
            os.mkdir(r'tmp')
        #fileJudge = os.path.exists('tmp')
        #judgeInfo += 'tmp create: ' + str(fileJudge)
        fileSystem.download_data(download_path)

        #zip
        zip_path = r'tmp/back.zip'
        dir_to_zip(r'tmp/pdfs', zip_path)
        #dir_to_zip(r'tmp/jsons', zip_path, 'a')
        #judgeInfo += '\n' + str(get_all('tmp'))

        with open(zip_path, 'rb') as afile:
            data = afile.read()
        afile.close()
        #return func.HttpResponse(judgeInfo)
        return func.HttpResponse(data)
    except:
        return func.HttpResponse(
            "DownLoad wrong, please try again!",
            status_code=400
        )
    finally:
        pass


def dir_to_zip(dir_path, zip_fp, mode='w'):
    r'''
    zip
    :param dir_path:     r'C:\data'
    :param zip_fp:  r'C:\data.zip'
    :return:
    '''
    if not zip_fp.endswith('zip'):
        return None    #save path si worng
    fps = []
    zipf = zipfile.ZipFile(zip_fp, mode) #create a zip object
    for root, _, fns in os.walk(dir_path):
        for afn in fns:
            file_path = os.path.join(root, afn)
            arcname = file_path.replace(dir_path, '') #relative pos of fn in dir_path
            zipf.write(file_path, arcname)
            fps.append(file_path)
    zipf.close()
    return zip_fp


def get_all(path):
    '''
    print dir!
    '''
    path_list = []
    paths = os.listdir(path)
    for i in paths:
        com_path = os.path.join(path, i)
        if os.path.isdir(com_path):
            path_list.append(get_all(com_path))
        elif os.path.isfile(com_path):
            path_list.append(com_path)
    return path_list
