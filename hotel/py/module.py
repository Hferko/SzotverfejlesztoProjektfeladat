import sys
sys.path.append('./py/')

#Module
class Module:

  #Constructor
  def __init__(self, args=None) -> None:

    #Set error
    self.set_error()

    #Set data
    self.set_data()

    #Set result
    self.set_result()

    #Set class
    self.set_class()

    #Set method
    self.set_method()

    #Set arguments
    self.set_args(args)

    #When is not error, then load
    if (not self.is_error()): self.load()

  """ Error """
  #Set error
  def set_error(self, msg=None, langId=None) -> None:
    self.__error  = msg
    self.set_langId(langId)
    if (isinstance(msg, str)):
      self.set_data()

  #Get error
  def get_error(self):
    return self.__error

  #Set error lang identifier
  def set_langId(self, langId):
    self.__langId = langId

  #Get error lang identifier
  def get_langId(self):
    return self.__langId

  #Check is error
  def is_error(self) -> bool:
    return isinstance(self.__error, str)


  """ Data """
  #Set data
  def set_data(self, data=None) -> None:
    self.__data = data

  #Get data
  def get_data(self):
    return self.__data


  """ Result """
  #Set result
  def set_result(self, result=None) -> None:
    if (isinstance(result, dict)):
      langId = None
      if ("langId" in result):
        langId = result["langId"]
      if ("errorMsg" in result):
        self.set_error(result["errorMsg"], langId)
      if ("data" in result):
        self.set_data(result["data"])
    else: self.__result = {
            "isError" : self.is_error(),
            "errorMsg": self.get_error(),
            "langId"  : self.get_langId(),
            "data"    : self.get_data()
          }

  #Get result
  def get_result(self, isEncode=False):
    self.set_result()
    if (isinstance(isEncode, bool) and isEncode):
          import json
          try:
            result = json.dumps(self.get_result())
          except ValueError:
            self.set_error( 'Encoding JSON data has failed!', 
                            'encodingJsonFailed')
            result = json.dumps(self.get_result())
          except Exception as e:
            self.set_error(",".join(e.args))
            result = json.dumps(self.get_result())
          return result
    else: return self.__result


  """ Class """
  #Set class
  def set_class(self, copy=None):
    self.__class = copy

  #Get class
  def get_class(self):
    return self.__class


  """ Method """
  #Set method
  def set_method(self, method=None):
    self.__method = method

  #Get method
  def get_method(self):
    return self.__method


  """ Arguments """
  #Set arguments
  def set_args(self, args=None) -> None:

    #When arguments not exist, then get arguments
    if (not isinstance(args, str)):

      #Get arguments
      import cgi
      form  = cgi.FieldStorage()
      args  = form.getvalue('data')
    
      #Check arguments is valid
      if (not isinstance(args, str)):
        self.set_error('Invalid arguments!', 'invalidArgs')

    #Check is not error
    if (not self.is_error()):
      import json
      try:
        self.__args = json.loads(args)
      except ValueError:
        self.set_error('Decoding JSON data has failed!', 'decodingJsonFailed')
      except Exception as e:
        self.set_error(','.join(e.args))

    #Check is not error again
    if (not self.is_error()):
      
      #Mege arguments with default 
      import utility as util 
      self.__args = util.Dictionary.merge({
        "moduleName"  : None,
        "className"   : None,
        "methodName"  : None,
        "argsToClass" : False,
        "argsToMethod": True,
        "args"        : None
      }, self.__args, True)

      #Check arguments
      if (isinstance(self.__args["className"], str)):
        if (not isinstance(self.__args["methodName"], str)):
          self.__args["argsToClass"]   = True
          self.__args["argsToMethod"]  = False
        if (self.__args["argsToClass"]):
          self.__args["argsToMethod"]  = False

  #Get arguments
  def get_args(self):
    return self.__args


  """ Load """
  #Load
  def load(self):
    import importlib
    try:

      #Import module
      module = importlib.import_module(self.__args["moduleName"])

      #Check is module class
      if (isinstance(self.__args["className"], str)):

        #Check exist
        self.set_class(getattr(module, self.__args["className"]))
        if (self.get_class()):

          #Create class (module always pass to class)
          if (self.__args["argsToClass"]):
                self.set_class(self.get_class()(self, self.__args["args"]))
          else: self.set_class(self.get_class()(self))

          #Check method
          if (isinstance(self.__args["methodName"], str)):

            #Check exist
            self.set_method(getattr(self.get_class(), self.__args["methodName"]))
            if (self.get_method()):

              #Call method
              if (self.__args["argsToMethod"]):
                    self.get_method()(self.__args["args"])
              else: self.get_method()()
            else:
              self.set_error('Method not found {}!'
                  .format(self.__args["methodName"]))
        else:
          self.set_error('Class not found {}!'
              .format(self.__args["className"]))

      #Check is module method
      elif (isinstance(self.__args["methodName"], str)):

        #Check exist
        self.set_method(getattr(module, self.__args["methodName"]))
        if (self.get_method()):
          self.get_method()(self, self.__args["args"])
        else:
          self.set_error('Method not found {}!'
              .format(self.__args["methodName"]))
      else:
        self.set_error('Missing class, or method property in module {}!'
            .format(self.__args["moduleName"]))
            
    except ImportError as ie:
      self.set_error(ie.msg)
    except Exception as e:
      self.set_error(",".join(e.args))


  """ To string """
  #To string
  def __str__(self):
    return self.get_result(True)