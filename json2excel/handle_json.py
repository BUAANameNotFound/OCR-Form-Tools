'''读取JSON文件'''
import json


def open_file(filename):
    '''打开文件'''
    file = open(filename)
    obj = json.load(file)
    return obj


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
