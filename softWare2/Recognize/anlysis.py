'''
json anlysis
'''
from collections import defaultdict
from .utils import readjson, find_json_file, get_analyzeResult, \
 get_pageResults, get_readResults, get_lines, get_tables, get_cells, get_text, \
 get_boundingBox, compare_xposition, compare_yposition, outjson

def part1_1(tables, preserveintable, tmptextintable, i):
    '''
    part1_1
    '''
    for table in tables:
        cells = get_cells(table)
        for cell in cells:
            text = get_text(cell)
            bounding_box = tuple(get_boundingBox(cell))
            tup = (text, bounding_box)
            preserveintable[tup] += 1
            tmptextintable[i].append(tup)

def part1_2(lines, preserveouttable, tmptextouttable, i):
    '''
    part1_2
    '''
    for line in lines:
        text = get_text(line)
        bounding_box = tuple(get_boundingBox(line))
        tup = (text, bounding_box)
        preserveouttable[tup] += 1
        tmptextouttable[i].append(tup)

def part1(filenames, path, others):
    '''
    part1
    '''
    preserveintable = others[0]
    tmptextintable = others[1]
    preserveouttable = others[2]
    tmptextouttable = others[3]
    for i, filename in enumerate(filenames):
        content = readjson(path, filename)
        analyze_result = get_analyzeResult(content)
        page_results = get_pageResults(analyze_result)
        tables = get_tables(page_results)
        part1_1(tables, preserveintable, tmptextintable, i)
        read_results = get_readResults(analyze_result)[0]
        lines = get_lines(read_results)
        part1_2(lines, preserveouttable, tmptextouttable, i)

def part2(filenames, others):
    '''
    part2
    '''
    tmptextintable = others[0]
    preserveintable = others[1]
    textintable = others[2]
    tmptextouttable = others[3]
    preserveouttable = others[4]
    textouttable = others[5]
    for i in range(len(filenames)):
        for item in tmptextintable[i]:
            if preserveintable[item] == 1:
                textintable[i].append(item)
        for item in tmptextouttable[i]:
            if preserveouttable[item] == 1:
                textouttable[i].append(item)

def part3(textouttable, samecorpus):
    '''
    part3
    '''
    for i in textouttable:
        for item1 in range(len(textouttable[i])):
            for item2 in range(item1 + 1, len(textouttable[i])):
                if compare_xposition(textouttable[i][item1], textouttable[i][item2]):
                    samecorpus[i][textouttable[i][item1]] = textouttable[i][item2]
                elif compare_xposition(textouttable[i][item2], textouttable[i][item1]):
                    samecorpus[i][textouttable[i][item2]] = textouttable[i][item1]
            if textouttable[i][item1] not in samecorpus[i]:
                samecorpus[i][textouttable[i][item1]] = ()

def part4(samecorpus, savexcorpus):
    '''
    part4
    '''
    for i in samecorpus:
        combinexcorpus = defaultdict(list)
        for item in samecorpus[i]:
            text = item[0]
            bounding_box = list(item[1])
            expandbox = ()
            son = samecorpus[i][item]
            while son:
                text += " " + son[0]
                expandbox = son[1]
                son = samecorpus[i][son]
            if expandbox:
                bounding_box[2:6] = list(expandbox)[2:6]
            combinexcorpus[i].append((text, tuple(bounding_box)))
        combinexcorpus[i] = sorted(combinexcorpus[i], key=lambda x: len(x[0]), reverse=True)
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

def part5(savexcorpus, samecorpus):
    '''
    part5
    '''
    for i in savexcorpus:
        for item1 in range(len(savexcorpus[i])):
            for item2 in range(item1 + 1, len(savexcorpus[i])):
                if compare_yposition(savexcorpus[i][item1], savexcorpus[i][item2]):
                    samecorpus[i][savexcorpus[i][item1]] = savexcorpus[i][item2]
                elif compare_yposition(savexcorpus[i][item2], savexcorpus[i][item1]):
                    samecorpus[i][savexcorpus[i][item2]] = savexcorpus[i][item1]
            if savexcorpus[i][item1] not in samecorpus[i]:
                samecorpus[i][savexcorpus[i][item1]] = ()

def part6(samecorpus, saveycorpus):
    '''
    part6
    '''
    for i in samecorpus:
        combineycorpus = defaultdict(list)
        for item in samecorpus[i]:
            text = item[0]
            bounding_box = list(item[1])
            expandbox = ()
            son = samecorpus[i][item]
            while son:
                text += " " + son[0]
                expandbox = son[1]
                son = samecorpus[i][son]
            if expandbox:
                rightupx = bounding_box[-4]
                if rightupx < expandbox[-4]:
                    rightupx = expandbox[-4]
                bounding_box[-4] = rightupx
                bounding_box[3] = rightupx
                bounding_box[-1] = expandbox[-1]
                bounding_box[-3] = expandbox[-1]
                bounding_box[2:6] = list(expandbox)[2:6]
            combineycorpus[i].append((text, tuple(bounding_box)))
        combineycorpus[i] = sorted(combineycorpus[i], key=lambda x: len(x[0]), reverse=True)
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

def part7(filenames, output, saveycorpus, path, name):
    '''
    part7
    '''
    for i, file in enumerate(filenames):
        begin = filenames[i].find('/')
        end = filenames[i].find('.pdf') + 4
        filename = file[begin+1: end]
        output[i] = {"document":filename, "labels":[]}
        #for item in textintable[i]:
        #    text = item[0]
        #    boundingBox = list(item[1])
        #    tmpjson = {"label":text, "key":None,
        #    "value":[{"page":1, "text":text, "boundingBoxes":[boundingBox]}]}
        #    output[i]["labels"].append(tmpjson)
        for item in saveycorpus[i]:
            text = item[0]
            bounding_box = list(item[1])
            tmpjson = {"label":text, "key":None,
                       "value":[{"page":1, "text":text, "boundingBoxes":[bounding_box]}]}
            output[i]["labels"].append(tmpjson)
    outjson(path, name, output)

def analyze_json(path=".", name="test.json"):
    '''
    analyze_json
    '''
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
    part1(filenames, path, [preserveintable, tmptextintable, preserveouttable, tmptextouttable])
    part2(filenames, [tmptextintable, preserveintable, textintable, tmptextouttable,\
          preserveouttable, textouttable])
    part3(textouttable, samecorpus)
    part4(samecorpus, savexcorpus)
    samecorpus = defaultdict(dict)
    part5(savexcorpus, samecorpus)
    part6(samecorpus, saveycorpus)
    part7(filenames, output, saveycorpus, path, name)
    #output = {"document":"test.pdf", "labels":[]}
    #for key in preserve:
    #    text = key[0]
    #    boundingBox = list(key[1])
    #    if preserve[key] != 1:
    #        continue
    #    tmpjson = {"label":text, "key":None,
    #    "value":[{"page":1, "text":text, "boundingBoxes":[boundingBox]}]}
    #    output["labels"].append(tmpjson)
    #outjson(path, name, output)
if __name__ == "__main__":
    analyze_json()
