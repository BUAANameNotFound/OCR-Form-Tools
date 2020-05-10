'''
The module is used for generate Pdf file!
'''
import azure.functions as func
from .gen_data import genall
from .utils import readjson, getlabels, getvalue, gettext, changetext, createmark, genpdf, outjson

def generate_data(fold_path, injsonname, inpdfname, outjsonname=r"gen.json", outpdfname=r"gen.pdf"):
    '''
    generate one data!
    '''
    marks = []

    gendict = {"NAME":1, "ADDRESS":2, "SEX":3, "PRICE":4, "DATE":5,
               "CURRENCY":4, "NUMBER":6, "EMAIL":7, "STRING":8, "SIGNATURE":9}
    try:
        content = readjson(fold_path, injsonname)
        labels = getlabels(content)
    except:
        return func.HttpResponse(
            'readjson and getlabel wrong!',
            status_code=400
        )
    try:
        for label in labels:
            values = getvalue(label)
            for value in values:
                text = gettext(value)
                changetext(value, genall(gendict[text]))
                marks.append(value)
    except:
        return func.HttpResponse(
            'genData wrong!',
            status_code=400
        )
    createmark(fold_path, marks)
    genpdf(fold_path, inpdfname, outpdfname)
    outjson(fold_path, outjsonname, content)


if __name__ == "__main__":
    #generate_data("test", "label.json", "template.pdf")
    pass
