'''
This module is use for genPDF
'''
import json
import random
from io import BytesIO
import azure.functions as func
import reportlab.pdfbase.ttfonts
from PyPDF2 import PdfFileReader, PdfFileWriter
from reportlab.pdfgen import canvas
from ..share_code import fileSystem


def readjson(path, name, container='wudi'):
    '''
    read json file
    '''
    res = fileSystem.open_file_bytes_io(f'{path}/{name}', container=container)
    return json.loads(res.getvalue())


def outjson(pro_name, outpdfname, content):
    '''
    generate json file
    '''
    content['document'] = outpdfname
    fileSystem.upload_string(json.dumps(content), f'{pro_name}/type3/{outpdfname}.labels.json', container='wudi')


def outJsonByte(content):
    '''
    change json to byte
    '''
    return json.dumps(content)


def getlabels(dic):
    '''
    return labels in dic
    '''
    return dic["labels"]

def getvalue(dic):
    '''
    return value in dic
    '''
    return dic["value"]

def gettext(dic):
    '''
    return text in dic
    '''
    return dic["text"]

def changetext(dic, value):
    '''
    change text with value
    '''
    dic["text"] = value

def createmark(pro_name, marks):
    '''
    create a mark pdf used for merging with form pdf
    '''
    pdf_buf = BytesIO()
    pdf_buf = fileSystem.open_file_bytes_io(f'{pro_name}/type1/template.pdf')
    #pdf_buf = fileSystem.open_templatepdf_file(pro_name)
    pdf_input = PdfFileReader(pdf_buf, strict=False)
    page = pdf_input.getPage(0)
    width = float(page['/MediaBox'][2])
    height = float(page['/MediaBox'][3])
    tmp_mark = BytesIO()
    c = canvas.Canvas(tmp_mark, pagesize=(float(page['/MediaBox'][2]), float(page['/MediaBox'][3])))
    c.translate(0, height)
    reportlab.pdfbase.pdfmetrics.registerFont(reportlab.pdfbase.ttfonts.TTFont('guofu',
                                                                               r'tmp/font.ttf'))
    for mark in marks:
        text = str(mark["text"])
        flag = False
        if text.find('|') != -1:
            flag = True
            text = text[:text.find('|')]
        text = text.split("#")
        if len(text) == 1:
            textlen = len(text[0])
        else:
            textlen = max(len(text[0]), len(text[1]))
        bounding = mark["boundingBoxes"][0]

        if bounding[0] < bounding[2]:
            leftx = bounding[0] * width
            rightx = bounding[2] * width
        else:
            leftx = bounding[2] * width
            rightx = bounding[0] * width
        if bounding[1] < bounding[-1]:
            leftupy = bounding[1] * height
            leftdowny = bounding[-1] * height
        else:
            leftupy = bounding[-1] * height
            leftdowny = bounding[1] * height

        xgap = rightx - leftx
        ygap = leftdowny - leftupy
        fontsize = random.uniform(ygap / 3, ygap / 2)
        if fontsize * textlen > xgap * 1.7:
            fontsize = xgap * 1.7 / textlen
            fontsize = random.uniform(fontsize / 1.3, fontsize)
        if flag:
            c.setFont('guofu', fontsize)
        else:
            c.setFont(c.getAvailableFonts()[0], fontsize)
        position = random.uniform(leftupy + ygap / 2, leftdowny)
        if len(text) * fontsize >= ygap:
            position = leftupy + fontsize
        for subtext in text:
            c.drawString(leftx, -position, subtext)
            position += fontsize
        c.setFillAlpha(1)
    c.save()
    fileSystem.upload_bytes(tmp_mark.getvalue(), f'{pro_name}/mark.pdf')


def genpdf(path, inpdf, outpdf):
    '''
    merge form pdf and mark pdf
    '''
    pdf_output = PdfFileWriter()
    pdf_buf = BytesIO()
    pdf_buf = fileSystem.open_file_bytes_io(f'{path}/{inpdf}')
    #pdf_buf = fileSystem.open_templatepdf_file(path)
    pdf_input = PdfFileReader(pdf_buf, strict=False)
    try:
        mark = BytesIO()
        mark = fileSystem.open_file_bytes_io(f'{path}/mark.pdf')

        pdf_watermark = PdfFileReader(mark, strict=False)
    except:
        return func.HttpResponse(
            'open mark fail!',
            status_code=400
        )
    page = pdf_input.getPage(0)
    page.mergePage(pdf_watermark.getPage(0))
    page.compressContentStreams()
    pdf_output.addPage(page)
    res = BytesIO()
    pdf_output.write(res)
    fileSystem.upload_bytes(res.getvalue(), f'{path}/type3/{outpdf}', container='wudi')
