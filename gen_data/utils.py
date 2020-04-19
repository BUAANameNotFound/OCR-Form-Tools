import json
import os
from PyPDF2 import PdfFileReader, PdfFileWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import reportlab.pdfbase.ttfonts
import random
from name import *

def readjson(path, name):
    
    f = open(os.path.join(path, name), "r", encoding="utf-8")
    content = json.load(f)
    f.close()
    
    return content

def outjson(path, name, content):

    f = open(os.path.join(path, name), "w", encoding="utf-8")
    json.dump(content, f)
    f.close()

def getlabels(dic):
    return dic["labels"]

def getvalue(dic):
    return dic["value"]

def gettext(dic):
    return dic["text"]

def changetext(dic, value):
    dic["text"] = value

def createmark(marks):
    width = letter[0]
    height = letter[1]
    markpdf = "mark.pdf"
    c = canvas.Canvas(markpdf, pagesize=letter)
    c.translate(0, height)
    reportlab.pdfbase.pdfmetrics.registerFont(reportlab.pdfbase.ttfonts.TTFont('guofu', os.path.join(DataDir, 'font.ttf')))
    for mark in marks:
        text = str(mark["text"])
        bounding = mark["boundingBoxes"][0]
        leftx = bounding[0] * width
        leftupy = bounding[1] * height
        leftdowny = bounding[-1] * height
        gap = leftdowny - leftupy
        fontsize = random.uniform(gap / 3, gap / 2)
        c.setFont('guofu', fontsize)
        
        c.drawString(leftx, -leftdowny + gap / 2, text)
        c.setFillAlpha(1)
    c.save()
    
def genpdf(inpdf, markpdf, outpdf):
    pdf_output = PdfFileWriter()
    input_stream = open(inpdf, 'rb')
    pdf_input = PdfFileReader(input_stream, strict=False)
    pdf_watermark = PdfFileReader(open(markpdf, 'rb'), strict=False)
    page = pdf_input.getPage(0)
    page.mergePage(pdf_watermark.getPage(0))
    page.compressContentStreams()  # 压缩内容
    pdf_output.addPage(page)
    pdf_output.write(open(outpdf, 'wb'))
        
if __name__ == "__main__":
    
    
    pdf = "mark.pdf"
    c = canvas.Canvas(pdf, pagesize=letter)
    reportlab.pdfbase.pdfmetrics.registerFont(reportlab.pdfbase.ttfonts.TTFont('guofu', 'font.ttf'))
    c.setFont('guofu', 30)
    content = "test"
    c.translate(0, letter[1])
    c.drawString(letter[0] * 0.3960311835577604, -letter[1] * 0.30481927710843376, content)
    c.setFillAlpha(0.05)
    c.save()
    
    pdf_output = PdfFileWriter()
    input_stream = open("test.pdf", 'rb')
    pdf_input = PdfFileReader(input_stream, strict=False)
    pdf_watermark = PdfFileReader(open(pdf, 'rb'), strict=False)
    page = pdf_input.getPage(0)
    page.mergePage(pdf_watermark.getPage(0))
    page.compressContentStreams()  # 压缩内容
    pdf_output.addPage(page)
    pdf_output.write(open("out.pdf", 'wb'))
