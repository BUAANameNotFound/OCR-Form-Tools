'''
The module is warp for azure storage!
'''
import logging
import os
import shutil
from io import BytesIO, StringIO
import azure.functions as func
from auzre.storage.blob import BlockBlobService
from azure.storage.blob import PublicAccess

DEFAULT_STORAGENAME = 'lyniupi'
DEFAULT_KEY = '1Y5H3obB3kT4NtMIE1babykABwW0LXFxyaJ43MBONcGmaxzt8RPCsmdmYBrhrR9QBySv9oYHFSsXyDKWHz8p3Q=='

DEFAULT_STORAGENAME = 'lyceshi'
DEFAULT_KEY = 'PcrYp+YILDxt54rzcPEPIk3Lhv9WXC9w64Ws7rP27TJEIyDdE4aa/g2mir4u6/PmuWqnbLtb0Zo3ny33wwh6EQ=='

def open_file_bytes_io(blob_name, container='wudi',
                       storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    open a file in container in ByteIO!
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    res = BytesIO()
    blob_service.get_blob_to_stream(container, blob_name, res)
    return res


def open_file_string_io(blob_name, container='wudi',
                        storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    open a file in container in stringIO!
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    res = StringIO()
    blob_service.get_blob_to_stream(container, blob_name, res)
    return res

def open_templatepdf_file(path, container='wudi',
                       storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    open the template Pdf file in BytesIO
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    res = BytesIO()
    files = blob_service.list_blobs(container)
    for afile in files:
        name = afile.name
        file_path = name[:name.find('/')]
        file_name = name[name.find('/')+1:]
        if file_path == path and file_name.find('template_') != -1:
            blob_service.get_blob_to_stream(container, afile.name, res)
            return res
    # find no template.pdf
    return func.HttpResponse(
        'Well, we find no template.pdf, you should upload it before generate data!',
        status_code=400
    )

def upload_string(blob_string, blob_name, container='wudi', blob_encoding='utf-8',
                  storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    upload file in String
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    # try:
    #     blob_service.create_container(container,
    # public_access=PublicAccess.Container, fail_on_exist=True)
    # except:
    #     logging.info(f"{container} have already exist! No deed to create again!")
    blob_service.create_blob_from_text(container, blob_name, blob_string, encoding=blob_encoding)


def upload_bytes(blob_bytes, blob_name, container='wudi',
                 storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    upload file in bytes or bytes array
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    # try:
    #     blob_service.create_container(container,
    # public_access=PublicAccess.Container, fail_on_exist=True)
    # except:
    #     logging.info(f"{container} have already exist! No deed to create again!")
    blob_service.create_blob_from_bytes(container, blob_name, blob_bytes)


def download_file(path, blob_name, container='wudi',
                  storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    download files from Azure storage!
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    blob_service.get_blob_to_path(container, blob_name, path)


def download_container(dir_path, container, storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    download all the blob in container!
    '''
    try:
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
        blob_service = BlockBlobService(account_name=storage_name, account_key=key)
        files = blob_service.list_blobs(container)
        for afile in files:
            blob_service.get_blob_to_path(container, afile.name, os.path.join(dir_path, f.name))
    except:
        return func.HttpResponse(
            'download container wrong!',
            status_code=400
        )


def download_data(path, storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    download the generate data in container!
    '''
    try:
        blob_service = BlockBlobService(account_name=storage_name, account_key=key)
        pdf_container = 'wudi'
        pdf_path = r'tmp/pdfs'
        if os.path.exists('tmp'):
            shutil.rmtree('tmp')
            logging.info('delete tmp')
        os.makedirs(pdf_path)
        logging.info('mkdirs path')
        files = blob_service.list_blobs(pdf_container)
        for afile in files:
            name = afile.name
            file_path = name[:name.find('/')]
            file_name = name[name.find('/')+1:]
            if file_path == path and file_name.find('type3/gen') != -1:
                file_name = file_name[file_name.find('/')+1:]
                blob_service.get_blob_to_path(pdf_container, name, os.path.join(pdf_path, file_name))
                logging.info(f'download {afile.name}')

        # jsonContainer = 'wudi'
        # jsonPath = r'tmp/jsons'
        # if not os.path.exists(jsonPath):
        #     os.makedirs(jsonPath)
        # files = blob_service.list_blobs(jsonContainer)
        # for f in files:
        #     name = f.name
        #     filePath = name[:name.find('/')]
        #     fileName = name[name.find('/')+1:]
        #     if filePath == path and fileName[0:3] == 'gen':
        #         blob_service.get_blob_to_path(jsonContainer, name,
        #   os.path.join(jsonPath, fileName))
        #         logging.info(f'download {f.name}')
    except:
        return func.HttpResponse(
            'download wrong! check it!',
            status_code=400
        )


def delete_container(container, storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    delete the container!
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    return blob_service.delete_container(container)


def delete_blob_file(path, container='wudi', storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    delete the specified file
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    blob_service.delete_blob(container, path)


def clear_comsuer_fold(fold, container='wudi', storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    clear fold before upload pdf
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    #if blob_service.exists(container, fold)
    files = blob_service.list_blobs(container)
    for afile in files:
        name = afile.name
        file_path = name[0:name.find('/')]
        if file_path == fold:
            blob_service.delete_blob(container, name)
            logging.info(f'delete {name}!')


def clear_container(fold, container, storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    clear the container!
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    #if blob_service.exists(container, fold)
    files = blob_service.list_blobs(container)
    for afile in files:
        name = afile.name
        if name.find(f'{fold}/gen') != -1 :
            blob_service.delete_blob(container, name)
            logging.info(f'delete {name}!')


def create_container(container, storage_name=DEFAULT_STORAGENAME, key=DEFAULT_KEY):
    '''
    create a container
    '''
    blob_service = BlockBlobService(account_name=storage_name, account_key=key)
    try:
        blob_service.create_container(container, public_access=PublicAccess.Container,
                                      fail_on_exist=True)
    except:
        logging.info(f'{container} have been create! No deed to create again!')
