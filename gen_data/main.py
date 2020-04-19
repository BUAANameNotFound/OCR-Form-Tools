from utils import *
from gen_data import *

def generate_data(inputdir, injsonname, inpdfname, outputdir=".", outjsonname="out.json", outpdfname="out.pdf"):
    marks = []

    gendict = {"DATE":5, "CURRENCY":4, "NUMBER":6}

    content = readjson(inputdir, injsonname)
    labels = getlabels(content)
    for label in labels:
        values = getvalue(label)
        for value in values:
            text = gettext(value)
            changetext(value, genall(gendict[text]))
            marks.append(value)

    createmark(marks)

    genpdf(inpdfname, "mark.pdf", outpdfname)
    outjson(outputdir, outjsonname, content)

if __name__ == "__main__":
    generate_data("test", "test.json", "test.pdf")
