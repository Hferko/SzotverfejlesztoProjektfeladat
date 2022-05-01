#!C:\Python\Python310\python.exe
print("content-type: text/html\n")

#Import module
from module import Module

#Set path
#Change working directory to web root directory 
def setPath():
  import os
  path = os.getcwd()
  path = path.strip().replace(os.sep, '/')
  if (path[-1] == '/'): path = path[-1]
  i = path.rfind('/')
  if (i != -1): path = path[0:i+1]
  os.environ.get('WORKING_DIRECTORY', path)
  os.chdir(path)

#Set path
setPath()

#Create module
module = Module()

#Resolve result
print(module, end='')