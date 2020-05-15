'''生成Excel文件'''
import openpyxl

def new_excel(path):
    '''新建excel，改变sheet名字，并写入内容'''
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'data'
    # ws.cell(row=1, column=2).value = 1
    wb.save(path)


def change_excel(path):
    #加载excel，并创建sheet，并写入内容
    wb = openpyxl.load_workbook(path)
    ws1 = wb.create_sheet('data')
    ws1.cell(row=1,column=2).value = 3
    wb.save(path)


def write_pdf_names(name_list, path):
    '''加载PDF文件名列'''
    wb = openpyxl.load_workbook(path)
    ws1 = wb['data']
    num = len(name_list)
    for i in range(num):
        ws1.cell(row=i + 2, column=1).value = name_list[i]
    wb.save(path)


def write_pdf_data(labels, values, path):
    wb = openpyxl.load_workbook(path)
    ws1 = wb['data']
    num = len(labels)
