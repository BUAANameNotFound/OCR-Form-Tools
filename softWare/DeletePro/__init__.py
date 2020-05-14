import azure.functions as func
from azure.storage.blob import BlockBlobService
from azure.storage.blob import PublicAccess
from ..share_code import fileSystem


def main(req: func.HttpRequest) -> str:
    '''
    Delete a project!
    '''
    #delete_path = ""
    if req.method != 'GET':
        return func.HttpResponse(
            'You should use ',
            status_code=400
        )

    #Upload the json in req_body to Azure storage as {filename}.json in {container}

    #tmp = fileSystem.openFileAsBytesIO(f'{upload_path}/{fileName}')
    return func.HttpResponse('We have delete the project!')
