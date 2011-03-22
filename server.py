from __future__ import with_statement
#import os, json, shutil, glob, pymongo
#import sys, re, logging, urlparse, urllib
#import gdata.youtube.service
from bottle import route, run, static_file, post, get, request, debug, response

debug(True)
path = "/Users/idm/Code/iandennismiller/googleio/public"

@route('/')
@route('/index.html')
def index():
    #response.headers['Access-Control-Allow-Origin'] = 'http://www.youtube.com'
    #response.headers['Access-Control-Allow-Origin'] = 'http://stage.youtube.com'
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'OPTIONS, GET, POST'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control'
    return static_file("index.html", root=path)

@route('/:filename#.+#')
def server_static(filename):
    return static_file(filename, root=path)

def go(host, port, new_path=None):
    global path
    if new_path:
        path = new_path
    run(host=host, port=port, reloader=True)

if __name__ == "__main__":
    go('127.0.0.1', 27182)
