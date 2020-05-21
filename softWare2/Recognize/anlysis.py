from .utils import *
from collections import defaultdict

def analyze_json(path=".", name="test.json"):
    preserveintable = defaultdict(int)
    preserveouttable = defaultdict(int)
    tmptextintable = defaultdict(list)
    tmptextouttable = defaultdict(list)
    textintable = defaultdict(list)
    textouttable = defaultdict(list)
    samecorpus = defaultdict(dict)
    savexcorpus = defaultdict(list)
    saveycorpus = defaultdict(list)
    output = defaultdict(dict)
    
    filenames = find_json_file(path)
    for i, filename in enumerate(filenames):
        
        content = readjson(path, filename)
        analyzeResult = get_analyzeResult(content)
        pageResults = get_pageResults(analyzeResult)
        tables = get_tables(pageResults)
        for table in tables:
            cells = get_cells(table)
            for cell in cells:
                text = get_text(cell)
                boundingBox = tuple(get_boundingBox(cell))
                t = (text, boundingBox)
                preserveintable[t] += 1
                tmptextintable[i].append(t)
                
        readResults = get_readResults(analyzeResult)[0]
        lines = get_lines(readResults)
        for line in lines:
            text = get_text(line)
            boundingBox = tuple(get_boundingBox(line))
            t = (text, boundingBox)
            preserveouttable[t] += 1
            tmptextouttable[i].append(t)
        
    for i in range(len(filenames)):
        for item in tmptextintable[i]:
            if preserveintable[item] == 1:
                textintable[i].append(item)
        for item in tmptextouttable[i]:
            if preserveouttable[item] == 1:
                textouttable[i].append(item)
    
    
    for i in textouttable:
        for a in range(len(textouttable[i])):
            for b in range(a + 1, len(textouttable[i])):
                if compare_xposition(textouttable[i][a], textouttable[i][b]):
                    samecorpus[i][textouttable[i][a]] = textouttable[i][b]
                elif compare_xposition(textouttable[i][b], textouttable[i][a]):
                    samecorpus[i][textouttable[i][b]] = textouttable[i][a]
            if textouttable[i][a] not in samecorpus[i]:
                samecorpus[i][textouttable[i][a]] = ()
    
    for i in samecorpus:
        combinexcorpus = defaultdict(list)
        for item in samecorpus[i]:
            text = item[0]
            boundingBox = list(item[1])
            expandbox = ()
            son = samecorpus[i][item]
            while son:
               text += " " + son[0]
               expandbox = son[1]
               son = samecorpus[i][son]
            if expandbox:
                boundingBox[2:6] = list(expandbox)[2:6]
            combinexcorpus[i].append((text, tuple(boundingBox)))
        
        combinexcorpus[i] = sorted(combinexcorpus[i], key=lambda x: len(x[0]),reverse=True)
        
        for itema in combinexcorpus[i]:
            texta = itema[0]
            flag = True
            for itemb in savexcorpus[i]:
                textb = itemb[0]
                if texta in textb:
                    flag = False
                    break
            if flag:
                savexcorpus[i].append(itema)
    
    samecorpus = defaultdict(dict)
    
    for i in savexcorpus:
        for a in range(len(savexcorpus[i])):
            for b in range(a + 1, len(savexcorpus[i])):
                if compare_yposition(savexcorpus[i][a], savexcorpus[i][b]):
                    samecorpus[i][savexcorpus[i][a]] = savexcorpus[i][b]
                elif compare_yposition(savexcorpus[i][b], savexcorpus[i][a]):
                    samecorpus[i][savexcorpus[i][b]] = savexcorpus[i][a]
            if savexcorpus[i][a] not in samecorpus[i]:
                samecorpus[i][savexcorpus[i][a]] = ()
    
    for i in samecorpus:
        combineycorpus = defaultdict(list)
        for item in samecorpus[i]:
            text = item[0]
            boundingBox = list(item[1])
            expandbox = ()
            son = samecorpus[i][item]
            while son:
               text += " " + son[0]
               expandbox = son[1]
               son = samecorpus[i][son]
            if expandbox:
                rightupx = boundingBox[-4]
                if rightupx < expandbox[-4]:
                    rightupx = expandbox[-4]
                boundingBox[-4] = rightupx
                boundingBox[3] = rightupx
                boundingBox[-1] = expandbox[-1]
                boundingBox[-3] = expandbox[-1]
                boundingBox[2:6] = list(expandbox)[2:6]
            combineycorpus[i].append((text, tuple(boundingBox)))
        
        combineycorpus[i] = sorted(combineycorpus[i], key=lambda x: len(x[0]),reverse=True)
        
        for itema in combineycorpus[i]:
            texta = itema[0]
            flag = True
            for itemb in saveycorpus[i]:
                textb = itemb[0]
                if texta in textb:
                    flag = False
                    break
            if flag:
                saveycorpus[i].append(itema)
    
    for i in range(len(filenames)):
        begin = filenames[i].find('/')
        end = filenames[i].find('.pdf') + 4
        filename = filenames[i][begin+1: end]
        output[i] = {"document":filename, "labels":[]}
        for item in textintable[i]:
            text = item[0]
            boundingBox = list(item[1])
            tmpjson = {"label":text, "key":None, "value":[{"page":1, "text":text, "boundingBoxes":[boundingBox]}]}
            output[i]["labels"].append(tmpjson)
        for item in saveycorpus[i]:
            text = item[0]
            boundingBox = list(item[1])
            tmpjson = {"label":text, "key":None, "value":[{"page":1, "text":text, "boundingBoxes":[boundingBox]}]}
            output[i]["labels"].append(tmpjson)

    outjson(path, name, output)
    
    '''
    output = {"document":"test.pdf", "labels":[]}
    for key in preserve:
        text = key[0]
        boundingBox = list(key[1])
        if preserve[key] != 1:
            continue
        tmpjson = {"label":text, "key":None, "value":[{"page":1, "text":text, "boundingBoxes":[boundingBox]}]}
        output["labels"].append(tmpjson)
    
    outjson(path, name, output)
    '''
    
if __name__ == "__main__":
    analyze_json()