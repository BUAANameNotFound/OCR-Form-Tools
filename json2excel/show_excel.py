'''对生成好的Excel文件进行可视化处理'''
import xlrd
from pyecharts import Bar
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

row0 = []
col0 = []

def judge_line(list):
    '''判断数据类型'''
    length = len(list)
    type = 'empty'
    for i in range(1, length):
        if type == 'empty':
            if list[i].ctype == 1:
                type = 'string'
            elif list[i].ctype == 2:
                if list[i].value % 1 == 0:
                    type = 'int'
                else:
                    type = 'number'
            elif list[i].ctype == 3:
                type = 'date'
            else :
                type = 'string'
        else:
            if type == 'int' and list[i].value % 1 != 0:
                type = 'number'
            else:
                continue
    return type

def read_excel(pathname):
    '''读取Excel信息'''
    data = xlrd.open_workbook(pathname)
    sheet = data.sheet_by_index(0)
    rows = sheet.nrows
    cols = sheet.ncols
    row0 = sheet.row(0)
    col0 = sheet.col(0)
    for i in range(1, cols):
        type = judge_line(sheet.col(i))
        if type == 'date':
            continue
            data_date(sheet.col(i))
        elif type == 'int':
            data_age(sheet.col(i))
        elif type == 'number':
            continue
            data_currency(sheet.col(i))
        else :
            continue
            data_string(sheet.col(i))
    

def data_age(data_list):
    '''根据age信息画图'''
    length = len(data_list)
    age_dic = {}
    for i in data_list[1:]:
        print(int(i.value))
        k = int(i.value)
        if k in age_dic.keys():
            age_dic[k] += 1
        else :
            age_dic[k] = 1
    age_key_list = list(age_dic.keys())
    age_key_list.sort()
    age_value_list = []
    for i in age_key_list:
        age_value_list.append(age_dic[i])
    with PdfPages('multipage_pdf.pdf') as pdf:
        plt.rcParams['font.sans-serif'] = ['SimHei']
        plt.rcParams['axes.unicode_minus'] = False
        plt.bar(age_key_list, age_value_list)
        plt.title('年龄统计图')
        pdf.savefig()
        plt.close()

