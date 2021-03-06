'''读取JSON文件'''
import json
import logging
from azure.storage.blob import ContainerClient

#CONNECTION_STR = 'DefaultEndpointsProtocol=https;AccountName=lyceshi;\
# AccountKey=PcrYp+YILDxt54rzcPEPIk3Lhv9WXC9w64Ws7rP27TJEIyDdE4aa/g2mir4\
# u6/PmuWqnbLtb0Zo3ny33wwh6EQ==;EndpointSuffix=core.windows.net'
CONNECTION_STR = 'DefaultEndpointsProtocol=https;AccountName=lyniupi;\
    AccountKey=1Y5H3obB3kT4NtMIE1babykABwW0LXFxyaJ43MBONcGmaxzt8RPCsmd\
        mYBrhrR9QBySv9oYHFSsXyDKWHz8p3Q==;EndpointSuffix=core.windows.net'

def open_file(filename):
    '''打开文件'''
    container_service = ContainerClient.from_connection_string(conn_str=CONNECTION_STR,
                                                               container_name='wudi')
    try:
        tmp = container_service.get_blob_client(filename)
    except Exception as err:
        logging.info(f'well, {filename} is not exist!')
    text = tmp.download_blob()
    data = text.readall()
    return json.loads(data)


def values2list(values_list):
    '''多个value转数据'''
    values_num = len(values_list)
    value_l = []
    for i in range(values_num):
        value = values_list[i]
        value_text = value['text']
        value_l.append(value_text)
    return value_l


def read_single_json(filename):
    '''处理一个JSON文件'''
    obj = open_file(filename)
    document_name = obj['document']
    labels_list = obj['labels']
    labels_num = len(labels_list)
    file_list_label = []
    file_list_value_l = []
    for i in range(labels_num):
        label = labels_list[i]
        label_name = label['label']
        values_list = label['value']
        value_l = values2list(values_list)
        file_list_label.append(label_name)
        file_list_value_l.append(value_l)
    return [document_name, file_list_label, file_list_value_l]


def read_single_json2(filename):
    '''处理一个预测时使用的JSON文件'''
    obj = open_file(filename)
    dic = obj['analyzeResult']
    dic = dic['documentResults'][0]
    labels_list = dic['fields']
    file_list_label = []
    file_list_value_l = []
    for i in labels_list.keys():
        try:
            item = labels_list[i]
            value_l = item['text']
            file_list_label.append(i)
            file_list_value_l.append([value_l])
        except TypeError:
            continue
    return [filename, file_list_label, file_list_value_l]
