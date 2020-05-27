'''对生成好的Excel文件进行可视化处理'''
from datetime import datetime
import random
from xlrd import xldate_as_tuple
from matplotlib.backends.backend_pdf import PdfPages
import xlrd
import matplotlib.pyplot as plt
from azure.cognitiveservices.language.textanalytics import TextAnalyticsClient
from msrest.authentication import CognitiveServicesCredentials

def judge_line(judge_list):
    '''判断数据类型'''
    length = len(judge_list)
    judge_type = 'empty'
    if judge_list[1].ctype == 1:
        judge = judge_list[1].value.replace('.', '')
        if judge_list[1].value.count('/'):
            judge_type = 'date_s'
        elif judge.isdigit():
            judge_type = 'number'
        elif entity_recognition(judge_list[1].value) == 1:
            judge_type = 'location'
        else:
            judge_type = 'string'
    elif judge_list[1].ctype == 2:
        if judge_list[1].value % 1 == 0:
            judge_type = 'int'
        else:
            judge_type = 'number'
    elif judge_list[1].ctype == 3:
        judge_type = 'date_i'
    else:
        judge_type = 'string'
    for i in range(1, length):
        if judge_type == 'int' and judge_list[i].value % 1 != 0:
            judge_type = 'number'
    return judge_type


def read_excel(pathname):
    '''读取Excel信息'''
    data = xlrd.open_workbook(pathname)
    sheet = data.sheet_by_index(0)
    cols = sheet.ncols
    col0 = sheet.col(0)
    for i in range(1, cols):
        col_type = judge_line(sheet.col(i))
        print(col_type)
        if col_type == 'date_i':
            data_date_i(sheet.col(i), i)
        elif col_type == 'date_s':
            data_date_s(sheet.col(i), i)
        elif col_type == 'int':
            data_age(sheet.col(i), i)
        elif col_type == 'number':
            data_currency(sheet.col(i), i, col0)
        elif col_type == 'location':
            data_string(sheet.col(i))
        else:
            data_string(sheet.col(i))


def data_age(data_list, num):
    '''根据age信息画图'''
    age_dic = {}
    for i in data_list[1:]:
        k = int(i.value)
        if k in age_dic.keys():
            age_dic[k] += 1
        else:
            age_dic[k] = 1
    age_key_list = list(age_dic.keys())
    age_key_list.sort()
    age_value_list = []
    for i in age_key_list:
        age_value_list.append(age_dic[i])
    filename = str(num) + 'age.pdf'
    with PdfPages(filename) as pdf:
        plt.rcParams['font.sans-serif'] = ['SimHei']
        plt.rcParams['axes.unicode_minus'] = False
        plt.bar(age_key_list, age_value_list)
        plt.title('年龄统计图')
        pdf.savefig()
        plt.close()
    return pdf


def data_date_i(data_list, num):
    '''根据date信息画图'''
    date_dic = {}
    for i in data_list[1:]:
        date = datetime(*xldate_as_tuple(i.value, 0))
        k = date.strftime('%Y-%m-%d')
        if k in date_dic.keys():
            date_dic[k] += 1
        else:
            date_dic[k] = 1
    date_key_list = list(date_dic.keys())
    date_key_list.sort()
    date_value_list = []
    for i in date_key_list:
        date_value_list.append(date_dic[i])
    filename = str(num) + 'date.pdf'
    with PdfPages(filename) as pdf:
        plt.rcParams['font.sans-serif'] = ['SimHei']
        plt.rcParams['axes.unicode_minus'] = False
        plt.xticks(range(len(date_key_list)), date_key_list, rotation=30)
        plt.plot(date_key_list, date_value_list, 'ro-',
                 color='#4169E1', alpha=0.8, linewidth=1, label='num')
        plt.title('日期统计图')
        pdf.savefig()
        plt.close()
    return pdf


def data_date_s(data_list, num):
    '''根据date信息画图'''
    date_dic = {}
    for i in data_list[1:]:
        item = i.value
        if item in date_dic.keys():
            date_dic[item] += 1
        else:
            date_dic[item] = 1
    date_key_list = list(date_dic.keys())
    date_key_list.sort()
    date_value_list = []
    for i in date_key_list:
        date_value_list.append(date_dic[i])
    filename = str(num) + 'date.pdf'
    with PdfPages(filename) as pdf:
        plt.rcParams['font.sans-serif'] = ['SimHei']
        plt.rcParams['axes.unicode_minus'] = False
        plt.plot(date_key_list, date_value_list, 'ro-',
                 color='#4169E1', alpha=0.8, linewidth=1, label='num')
        plt.title('日期统计图')
        pdf.savefig()
        plt.close()
    return pdf


def data_currency(data_list, num, col0):
    '''根据currency信息画图'''
    length = len(data_list)
    currency_key_list = []
    for i in range(1, length):
        name_value = col0[i].value
        currency_key_list.append(name_value)
    currency_value_list = []
    for i in data_list[1:]:
        k = float(i.value)
        currency_value_list.append(k)
    filename = str(num) + str(data_list[0].value) + '.pdf'
    with PdfPages(filename) as pdf:
        plt.rcParams['font.sans-serif'] = ['SimHei']
        plt.rcParams['axes.unicode_minus'] = False
        plt.bar(currency_key_list, currency_value_list)
        plt.title(str(data_list[0].value) + '统计图')
        pdf.savefig()
        plt.close()
    return pdf



def data_string(data_list):
    '''处理地图，返回HTML地图，（随机算法）'''
    length = len(data_list)
    value = [0, 0, 0, 0, 0, 0, 0, 0]
    loop = 1
    while loop < length:
        loop += 1
        rand = random.randint(0, 7)
        value[rand] += 1
    attr = ["China", "Brazil", "Russia", "United States", "Mexico", "Australia", "India", "Algeria"]
    dic = {}
    length = len(attr)
    for i in range(length):
        if value[i] != 0:
            dic[attr[i]] = value[i]
    # return dictionary
    return dic


def authenticate_client():
    '''验证实体识别'''
    key = "5d8c9013ec6540048537058972c695e0"
    endpoint = "https://nashizhendeliupi.cognitiveservices.azure.com"
    credentials = CognitiveServicesCredentials(key)
    text_analytics_client = TextAnalyticsClient(
        endpoint=endpoint, credentials=credentials)
    return text_analytics_client

def entity_recognition(string_to_recognize):
    '''开始识别实体'''
    client = authenticate_client()
    try:
        documents = [{"id": "1", "language": "en", }]
        string_to_recognize_replace = string_to_recognize.replace("#", " ")
        documents[0]["text"] = string_to_recognize_replace
        response = client.entities(documents=documents)
        for document in response.documents:
            for entity in document.entities:
                if entity.type == "Location" or entity.type == "Organization":
                    return 1
        return 0
    except SystemExit as err:
        print("Encountered exception. {}".format(err))
