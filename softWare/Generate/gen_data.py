'''
This module is used for gendata called by genPDF and utils
'''
import random
import string
import json
from .name import Names, Cities, Phones
from .data import emails, fakeNames, address
from ..share_code import fileSystem


def genage(low=1, high=80):
    '''
    return a age : int
    '''
    return random.randint(low, high)


def gen_fake_name():
    '''
    return a fakeName : str
    '''
    return fakeNames[random.randint(0, len(fakeNames)-1)]


def genname():
    '''
    return a name
    '''
    #the data is in dataset, you cna just use fileSystem to get it
    tmp = fileSystem.open_file_bytes_io(Names, container='dataset')
    namedict = json.loads(tmp.getvalue())
    names = namedict["name"]
    length = len(names)
    pick = random.randint(0, length - 1)
    return names[pick]

def gen_address():
    '''
    return a address in USA : str
    '''
    return address[random.randint(0, len(address)-1)]


def gencity():
    '''
    return an address : str
    '''
    tmp = fileSystem.open_file_bytes_io(Cities, container='dataset')
    citydict = json.loads(tmp.getvalue())
    cities = citydict["city"]
    citynum = len(cities)
    pickcity = random.randint(0, citynum - 1)
    return cities[pickcity]


def gensex():
    '''
    return a sex : str
    '''
    sexs = ["M", "F"]
    picksex = random.randint(0, 1)
    return sexs[picksex]

def genprice(low=0, high=1000):
    '''
    return a price : float
    '''
    price = random.uniform(low, high)
    return round(price, 2)

def gendate(year=2010):
    '''
    return a date : str
    '''
    run = 0
    month = random.randint(1, 12)
    daydict = {0 : {1 : 31, 2 : 28, 3 : 31, 4 : 30, 5 : 31, 6 : 30,
                    7 : 31, 8 : 31, 9 : 30, 10 : 31, 11 : 30, 12 : 31},
               1 : {1 : 31, 2 : 29, 3 : 31, 4 : 30, 5 : 31, 6 : 30,
                    7 : 31, 8 : 31, 9 : 30, 10 : 31, 11 : 30, 12 : 31}}
    if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
        run = 1
    days = daydict[run][month]
    day = random.randint(1, days)
    month = str(month).rjust(2, "0")
    day = str(day).rjust(2, "0")
    return '%s/%s/%d' % (day, month, year)

def genphone():
    '''
    return a phone number : str
    '''
    phonedict = json.loads(fileSystem.open_file_bytes_io(Phones, container='dataset').getvalue())
    phones = phonedict["US"]
    phonenum = len(phones)
    pickphone = random.randint(0, phonenum - 1)
    switch = ""
    for _ in range(3):
        switch += str(random.randint(0, 9))
    number = ""
    for _ in range(4):
        number += str(random.randint(0, 9))
    return "%s-%s-%s" % (pickphone, switch, number)


def gen_email():
    '''
    return an email : str
    '''
    return emails[random.randint(0, len(emails)-1)]


def gen_string():
    '''
    return a random string : str
    '''
    tmpstr = ''.join(random.sample(string.ascii_letters + string.digits, 10))
    return tmpstr


def gen_signature():
    '''
    return a signature : str
    '''
    tmp = fileSystem.open_file_bytes_io(Names, container='dataset')
    namedict = json.loads(tmp.getvalue())
    names = namedict["name"]
    length = len(names)
    pick = random.randint(0, length - 1)
    return names[pick] + '|SIGNATURE'


def genall(num, agelow=1, agehigh=80, pricelow=0, pricehigh=1000, dateyear=2010):
    '''
    generate data by type
    '''
    if num == 0:
        return genage(agelow, agehigh)
    elif num == 1:
        return genname()
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
    elif num == 7:
        return gen_email()
    elif num == 8:
        return gen_string()
    elif num == 9:
        return gen_signature()
    else:
        return "wrong!"
