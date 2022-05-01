from module import Module
import utility as util

#Language
class Language:

  #Constructor
  def __init__(self, module:Module=None, id=None) -> None:
    self.__module = module
    self.set_id(id)

  #Set language identifier
  def set_id(self, id):
    self.__id = id

  #Get language identifier
  def get_id(self):
    return self.__id

  #Set file
  def set_file(self, name):
    self.__file = "./lang/" + name + ".json"

  #Get file
  def get_file(self):
    return self.__file

  #Set data
  def __set_data(self, data, key):

    # Check data key valid
    if ((key == 'available' and not isinstance(data[key], list)) or
        (key == 'data'      and not isinstance(data[key], dict))):
      self.__module.set_error('Invalid format {}!'.format(self.get_file()))
      return

    #When is key available
    if (key == 'available'):

      #Check is not empty
      if (len(data[key]) > 0):
        
        #Each item
        for i in range(len(data[key])):

          # Merge items with default
          data[key][i] = util.Dictionary.merge({
            "id":"",
	          "type":"west",
            "name":"",
            "local":"",
            "img":"",
            "valid": True
          }, data[key][i], True)

      #Filter by valid, and set id
      data[key]   = [x for x in data[key] if x['valid']]
      data["id"]  = self.get_id()

      #Set index
      if (len(data[key]) > 0):
            data["index"] = util.Array.indexOfKey(data[key], 'id', self.get_id())
            if (data["index"] == -1):
                data["index"] = 0
                data["id"] = data[key][0]['id']
                self.set_id(data["id"]) 
      else: data["index"] = -1
    
    #Set data
    self.__module.set_data(data)

  #Get language properties
  def get_properties(self):

    #Set file
    self.set_file('available')
  
    #Get available language
    self.read('available')

    #Check is error
    if (self.__module.is_error()):
      return

    #Set file
    self.set_file(self.get_id())

    #Read
    self.read('data')

  #Read
  def read(self, key):

    #Get/Check data
    data = self.__module.get_data()
    if (not isinstance(data, dict)):
      data = {key: data}
    f = None

    import json
    try:

      #Open file
      f = open(self.get_file(), "r", encoding='utf-8')

      #Get data
      data[key] = json.load(f)

      #Set data
      self.__set_data(data, key)
      
    except FileNotFoundError:
      self.__module.set_error('File not found {}!'.format(self.get_file()))
    except OSError:
      self.__module.set_error('Open error {}!'.format(self.get_file()))
    except Exception as e:
      self.__module.set_error(",".join(e.args))
    finally:
      if (f):
        f.close()