import logging
import os
import shutil
import azure.functions as func
#from azure.storage.blob import BlockBlobService
from .genPDF import generate_data
from ..share_code import fileSystem
from .name import DataDir

def main(req: func.HttpRequest) -> func.HttpResponse:
    '''
    generate pdf and Json files!
    '''
    logging.info('Generate json files and pdf files')
    num_tmp = req.params.get('genNum')
    num = num_tmp if num_tmp is not None else '5'
    num = '49' if int(num) > 49 else num

    if req.params.get('path') is None:
        return func.HttpResponse(
            'Wrong in path parameter! You should give the path!',
            status_code=400
        )

    pro_name = req.params.get('path')

    #generate
    template_file = 'type1/template.pdf'
    label_file = 'label.json'
    
    data_path = 'tmp'
    if os.path.exists('tmp'):
        shutil.rmtree('tmp')
        logging.info('delete tmp')
    os.makedirs(data_path)
    logging.info('mkdirs path')
    fileSystem.download_file(r'tmp/font.ttf', 'font.ttf', 'dataset')

    logging.info(f'clear {pro_name} fold in container begin!')
    fileSystem.clear_container(f'pro_name/type3', 'wudi')
    logging.info('clear completely!')

    for i in range(int(num)):
        pdf_file = 'genPdf{}.pdf'.format(i+1)

        generate_data(pro_name, label_file, template_file, outpdfname=pdf_file)

        logging.info('generate one pdf and jsonFile!')

    fileSystem.delete_blob_file(f'{pro_name}/mark.pdf')
    #return
    return func.HttpResponse(f"We have generated {num} files! You can just download them!")


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
