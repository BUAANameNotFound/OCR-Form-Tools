import random

from name import *
from utils import *

def genage(low=1, high=80):
    return random.randint(low, high)

def genname(year=2010):
    namedict = readjson(DataDir, Names)
    if year not in namedict:
        year = 2010
    names = namedict[str(year)]
    length = len(names)
    pick = random.randint(0, length - 1)
    return names[pick][0]

def gencity():
    citydict = readjson(DataDir, Cities)
    states = list(citydict.keys())
    statenum = len(states)
    pickstate = random.randint(0, statenum - 1)
    state = states[pickstate]
    counties = citydict[state]
    countynum = len(counties)
    pickcounty = random.randint(0, countynum - 1)
    return counties[pickcounty] + "," + state

def gensex():
    sexs = ["M", "F"]
    picksex = random.randint(0, 1)
    return sexs[picksex]

def genprice(low=0, high=1000):
    price = random.uniform(low, high)
    return round(price, 2)

def gendate(year=2010):
    run = 0
    month = random.randint(1, 12)
    daydict = {0 : {1 : 31, 2 : 28, 3 : 31, 4 : 30, 5 : 31, 6 : 30, 7 : 31, 8 : 31, 9 : 30, 10 : 31, 11 : 30, 12 : 31},
               1 : {1 : 31, 2 : 29, 3 : 31, 4 : 30, 5 : 31, 6 : 30, 7 : 31, 8 : 31, 9 : 30, 10 : 31, 11 : 30, 12 : 31}}
    if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
        run = 1
    days = daydict[run][month]
    day = random.randint(1, days)
    month = str(month).rjust(2, "0")
    day = str(day).rjust(2, "0")
    return '%s/%s/%d' % (day, month, year)

def genphone():
    phonedict = readjson(DataDir, Phones)
    phones = phonedict["US"]
    phonenum = len(phones)
    pickphone = random.randint(0, phonenum - 1)
    switch = ""
    for i in range(3):
        switch += str(random.randint(0, 9))
    number = ""
    for i in range(4):
        number += str(random.randint(0, 9))
    return "%s-%s-%s" % (phones[pickphone], switch, number)

def genall(num, agelow=1, agehigh=80, nameyear=2010, pricelow=0, pricehigh=1000, dateyear=2010):
    if num == 0:
        return genage(agelow, agehigh)
    elif num == 1:
        return genname(nameyear)
    elif num == 2:
        return gencity()
    elif num == 3:
        return gensex()
    elif num == 4:
        return genprice(pricelow, pricehigh)
    elif num == 5:
        return gendate(dateyear)
    elif num == 6:
        return genphone()
    else:
        return "wrong!"