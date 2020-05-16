import azure.functions as func
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
    pro_path = req.params.get('path')
    try:
        fileSystem.clear_comsuer_fold(pro_path)
    except:
        return func.HttpResponse(
            'Clear wrong! please contact the back-end',
            status_code=400
        )
    
    return func.HttpResponse('We have delete the project!')
