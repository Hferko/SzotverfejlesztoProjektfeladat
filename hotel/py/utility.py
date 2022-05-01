import mysql.connector
import datetime

#Database
class Database:

  #Constructor
  def __init__(self, db=None, options=None) -> None:

    #Set attributes
    self.__connection = None
    self.__cursor = None
    
    #Set options
    self.set_options(options)

    #Set result
    self.set_result()

    #Connect to dabase
    self.connect(db)

    #Create database cursor to perform SQL operation
    self.set_cursor()

  #Set options
  def set_options(self, options) -> None:

    #When is bool, then set dictionary property
    if (isinstance(options, bool)):
      options = {'dictionary':options}
    
    #Merge with default properties
    self.__options = Dictionary.merge({
      'buffered'  : True,
      'dictionary': False
    }, options, True)
  
  #Get options
  def get_options(self, key=None) -> any:

    #Check key exist, and options has key property 
    if (self.__options and isinstance(key, str) and key in self.__options):
          return self.__options[key]
    else: return self.__options

  #Set/Reset result
  def set_result(self):
    self.__result = {
      'isError' : False,
      'errorMsg': None,
      'langId'  : None,
      'data'    : {}
    }

  #Connect to dabase
  def connect(self, db=None):
    
    #Set connection details
    config = {
      'host'        : 'localhost', 
      'user'        : 'root', 
      'password'    : '',
      'autocommit'  : True,
      'use_unicode' : True,
      'database'    : db, 
      'charset'     : 'utf8'
    }

    try:

      #Create connection
      self.__connection = mysql.connector.connect(**config)
  
    # MySql exception
    except mysql.connector.Error as e:
      self.set_error(e.msg)

    #Exception
    except Exception as e:
      self.set_error(",".join(e.args))

  #Close database connection
  def close(self):
    if (self.__cursor):
      self.__cursor.close()
    if (self.__connection):
      self.__connection.close()

  #Create database cursor
  def set_cursor(self):

    #Check is not error
    if (not self.isError()):

      #When cursor exist, then close cursor
      if (self.__cursor):
        self.__cursor.close()

      try:
      
        #Create database cursor
        self.__cursor = self.__connection.cursor(**self.get_options())

      # MySql exception
      except mysql.connector.Error as e:
        self.set_error(e.msg)

      #Exception
      except Exception as e:
        self.set_error(",".join(e.args))

  #Get database connection
  def get_cursor(self):
    return self.__cursor

  #Execute
  def execute(self, transactions=None):
    
    #Check is not error
    if (not self.isError()):

      #Set error
      isError = False

      #Check transaction(s)
      if (isinstance(transactions, str)):
        transactions = [Transaction(transactions)]
      if (not isinstance(transactions, list)):
        transactions = [transactions]

      #Start transaction
      self.__connection.start_transaction()

      #Each transaction(s)
      for index, trans in enumerate(transactions):

        #Check is transaction
        if (isinstance(trans, Transaction)):

          #Check is transaction valid
          if (trans.is_valid()):

            try:
              
              #Execute transaction
              self.__cursor.execute(
                trans.get_query(),
                trans.get_params()
              )

              #Get transaction identifier
              id = trans.get_args('id')
              if (not id):
                id = index

              #Set result transaction identifier
              self.__result['data'][id] = {}

              #Get transaction type
              type = trans.get_type()

              #When transaction type is SELECT
              if (type == 'SELECT'):

                # Set result
                self.__result['data'][id]['rows'] = self.__cursor.fetchall()

                #Check to set field type
                if (trans.get_args('setFieldType')):
                  self.set_field_type(id)

                #Check to get columns
                if (trans.get_args('columns') and not self.get_options('dictionary')):
                  self.__result['data'][id]['columns'] = self.__cursor.column_names

              #When transaction type is UPDATE or INSERT or DELETE
              elif (type == "UPDATE" or 
                    type == "INSERT" or 
                    type == "DELETE"):

                #Set result number of rows affected
                self.__result['data'][id]['rowsAffected'] = self.__cursor.rowcount

                #When query type is INSERT and  has row affect success
                if (trans.get_type() == 'INSERT' and self.__cursor.rowcount != 0):

                  #Set result last auto increment identifier
                  self.__result['data'][id]['lastAutoIncId'] = self.__cursor.lastrowid

              else:

                #Set transaction success to True
                self.__result['data'][id]['success'] = True

              #Get transaction completed method, and check exist
              completed = trans.get_args('completed')
              if (completed != None):
                
                #Execute transaction completed method
                isError = not completed(self, self.__result['data'])

                #Check is error
                if (isError):
                  self.__connection.rollback()
                  break
              
              #When only one transaction, then remove transaction identifier
              if (len(transactions) == 1):
                self.__result['data'] = self.__result['data'][id]

            # MySql exception
            except mysql.connector.Error as e:
              self.__connection.rollback()
              self.set_error(e.msg)
              break

            #Exception
            except Exception as e:
              self.__connection.rollback()
              self.set_error(",".join(e.args))
              break
          else:
            self.__connection.rollback()
            self.set_error('Invalid transaction!')
            break  
        else:
          self.__connection.rollback()
          self.set_error('Invalid transaction!')
          break

      #Check is not error
      if (not self.isError() and not isError):
        self.__connection.commit()

  #Set error
  def set_error(self, msg=None, langId=None):
    self.__result['isError']  = True
    self.__result['errorMsg'] = msg
    self.__result['langId']   = langId
    self.__result['data']     = None

  #Get result
  def get_result(self, isCopy=True):
    if (not isinstance(isCopy, bool)):
      isCopy = True
    if (isCopy):
          return self.__result.copy()
    else: return self.__result

  #Check is error
  def isError(self):
    return self.__result['isError']

  #Set field type
  def set_field_type(self, id):

    #Check data exist
    if (    self.__result['data'][id]['rows'] and 
        len(self.__result['data'][id]['rows']) > 0):

      #Import datetime
      import datetime

      #Each row
      for i, row in enumerate(self.__result['data'][id]['rows']):

        #Set convert to false
        isConv = False

        #Convert row tuple to list
        row = list(row)

        #Each columns
        for j in range(len(self.__cursor.column_names)):

          #Date
          if (isinstance(row[j], datetime.date)):
            isConv = True
            row[j] = row[j].strftime('%Y.%m.%d')

          #Datetime
          elif (isinstance(row[j], datetime.datetime)):
            isConv = True
            row[j] = row[j].strftime('%Y.%m.%d %H:%i:%s')

        #Check is converted
        if (isConv):

          #Convert row list to tuple
          row = tuple(row)

          #Set result
          self.__result['data'][id]['rows'][i] = row

#Transaction
class Transaction:

  #Constructor
  def __init__(self, query, params=None, args=None) -> None:

    #Set attributes
    self.set_query(query)
    self.set_type()
    self.set_params(params)
    self.set_args(args)

  #Set query
  def set_query(self, query) -> None:

    #Crate attribute query
    self.__query = None

    #Check is valid
    if (isinstance(query, str)):

      #Remove spaces from begin, end, and check is valid again
      #When is not empty, then set query
      query = query.strip()
      if (query != ''):
        self.__query = query
  
  #Get query
  def get_query(self, isParseParams=None) -> str:
    if (isinstance(isParseParams, bool) and isParseParams and self.__params):
          return self.__query%(tuple(self.__params))
    else: return self.__query

  #Set type
  def set_type(self) -> None:

    #Check transaction is valid
    if (self.is_valid()):

      #Get first word from query, and convert to uppercase
      type = self.__query.split()[0].upper()

      #Check/Set transaction type
      if (type in ['CREATE','DROP','ALTER', 'SELECT',
                   'UPDATE','INSERT','DELETE']):
        self.__type = type
      else:
        self.__type = None
    else:
      self.__type = None
  
  #Get type
  def get_type(self) -> str:
    return self.__type

  #Set arguments
  def set_args(self, args):

    #Check transaction is valid
    if (self.is_valid()):

      #When is string, then set identifier property as default
      if (isinstance(args, str)):
        args = {'id':args}

      #When is bool, then set convert field type property as default
      elif (isinstance(args, bool)):
        args = {'setFieldType':args}

      #When is calleble, then set completed function property as default
      if (hasattr(args, '__call__')):
        args = {'completed':args}

      #Merge with default properties
      args = Dictionary.merge({
        'id'          : None,
        'isColumns'   : True,
        'setFieldType': False,
        'completed'   : None
      }, args, True)

      #Check identifier
      if (isinstance(args['id'], str)):
        args['id'] = args['id'].strip()
        if (args['id'] == ''):
          args['id'] = None
      else:
        args['id'] = None

      #Check completed function
      if (not hasattr(args['completed'], '__call__')):
        args['completed'] = None

      #Set arguments
      self.__args = args
    else:  
      self.__args = None

  #Get argument(s)
  def get_args(self, key=None):

    #Check key exist, and arguments has key property 
    if (self.__args and isinstance(key, str) and key in self.__args):
          return self.__args[key]
    else: return self.__args

  #Set params
  def set_params(self, params) -> None:

    #Check transaction is valid
    if (self.is_valid() and params):

      #When type is not list, then convert
      if (not isinstance(params, list)):
        params = [params]

      #Check is not empty
      if (len(params) > 0):

        #Convert rows to one list
        if (isinstance(params[0], tuple)):
          self.__params = [r for s in params for r in s]
        else:
          self.__params = params
      else:
        self.__params = None
    else:
      self.__params = None
  
  #Get params
  def get_params(self) -> list:
    return self.__params

  #Check transaction is valid
  def is_valid(self):
    return self.__query != None

#Dictionary
class Dictionary:

  #Merge
  @staticmethod
  def merge(target, source, isExistKeys=False):
    
    #Check parameters
    if (not isinstance(target, dict)):
      target = {}
    if (not isinstance(source, dict)):
      source = {}
    if (not isinstance(isExistKeys, bool)):
      isExistKeys = False

    #Check source not empty
    if (len(source) > 0):
      
      #Each source keys
      for key in source:
        if (key in target):
          if (target[key] == None):
            target[key] = source[key]
            continue
          elif (type(target[key]) == type(source[key])):
            if (isinstance(target[key], dict)):
              target[key] = Dictionary.merge(target[key], source[key], isExistKeys)
            else:  
              target[key] = source[key]
        elif (not isExistKeys): 
          target[key] = source[key]

    #Return result
    return target

#Array
class Array:

  #Index of value
  @staticmethod
  def indexOf(arr, value):
    
    #Check arguments
    if (not isinstance(arr, list) or len(arr) == 0):
      return -1

    #Get index of value  
    try:
      index = arr.index(value)
      return index
    except ValueError:
      return -1

  #Index of key value
  @staticmethod
  def indexOfKey(arr, key, value):

    #Check arguments
    if (not isinstance(arr, list) or len(arr) == 0 or 
        not isinstance(key, str)):
      return -1
    
    #Remove white space, and check key
    key = key.replace(" ", "")
    if (key == ""):
      return -1

    try:
      for i, dic in enumerate(arr):
        if dic[key] == value:
          return i
      return -1
    except ValueError:
      return -1

#Date
class Date:

  #Get current date
  @staticmethod
  def getCurrentDate():
    return datetime.date.today()

  #Get current datetime
  @staticmethod
  def getCurrentDateTime():
    return datetime.datetime.today()

  #String to date
  @staticmethod
  def strToDate(s):
    if (isinstance(s, str)):
      s = s.strip().replace('.', '-').replace('/', '-')
      if (len(s) == 10):
        try:
            return datetime.datetime.strptime(s, "%Y-%m-%d")
        except ValueError:
            return None
      else: return None
    else:   return None

  #Date to string
  @staticmethod
  def dateToStr(d):
    if (isinstance(d, datetime.date)):
          return d.strftime("%Y-%m-%d")
    else: return None

  #String to datetime
  @staticmethod
  def strToDateTime(s, isBeg=None):
    if (isinstance(s, str)):
      s = s.strip().replace('.', '-').replace('/', '-')
      if (len(s) == 10):
        if (not isinstance(isBeg, bool)):
          isBeg = True
        if (isBeg):
              s += " 00:00:00"
        else: s += " 23:59:59"
      if (len(s) == 19):
        try:
            return datetime.datetime.strptime(s,"%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None
      else: return None
    else:   return None

  #Datetime to string
  @staticmethod
  def dateTimeToStr(d):
    if (isinstance(d, datetime.datetime)):
          return d.strftime("%Y-%m-%d %H:%M:%S")
    else: return None

  #String to timestamp
  @staticmethod
  def strToTimestamp(s, isBeg=None):
    return Date.datetimeToTimestamp(Date.strToDateTime(s, isBeg))

  #Datetime to timestamp
  @staticmethod
  def datetimeToTimestamp(d):
    if (isinstance(d, datetime.datetime)):
      try:
          return datetime.datetime.timestamp(d)
      except ValueError:
          return None
    else: return None

  #Timestamp to datetime
  @staticmethod
  def timestampToDateTime(t):
    try:
      return datetime.fromtimestamp(t)
    except ValueError:
      return None

  #Date to iso format
  @staticmethod
  def dateToIsoFormat(d):
    if (isinstance(d, datetime.date) or
        isinstance(d, datetime.datetime)):
      try:
          return d.isoformat()
      except ValueError:
          return None
    else: return None