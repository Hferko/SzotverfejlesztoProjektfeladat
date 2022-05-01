import json
from module import Module
import utility as util

#Reservation
class Reservation:

  #Constructor
  def __init__(self, module:Module=None, args=None) -> None:

    #Set attributes
    self.__module = module
    self.set_arrival(args)
    self.set_leaving(args)
    self.set_adults(args)
    self.set_children(args)
    self.set_guest(args)
    self.set_room_id(args)

  #Set arrival
  def set_arrival(self, args):
    if (isinstance(args, dict) and 'arrival' in args):
          self.__arrival = util.Date.strToDate(args['arrival'])
    else: self.__arrival = None

  #Get arrival
  def get_arrival(self, isStr=None):
    if (isinstance(isStr, bool) and isStr):
          return util.Date.dateToStr(self.__arrival)
    else: return self.__arrival

  #Set leaving
  def set_leaving(self, args):
    if (isinstance(args, dict) and 'leaving' in args):
          self.__leaving = util.Date.strToDate(args['leaving'])
    else: self.__leaving = None

  #Get leaving
  def get_leaving(self, isStr=None):
    if (isinstance(isStr, bool) and isStr):
          return util.Date.dateToStr(self.__leaving)
    else: return self.__leaving

  #Get person count
  def get_person(self):
      return self.__adults + self.__children

  #Set adults
  def set_adults(self, args):
    if (isinstance(args, dict) and 'adults' in args and
        isinstance(args['adults'], int) and args['adults'] > 0):
          self.__adults = args['adults']
    else: self.__adults = 0

  #Get adults
  def get_adults(self):
    return self.__adults

  #Set children
  def set_children(self, args):
    if (isinstance(args, dict) and 'children' in args and
        isinstance(args['children'], int) and args['children'] >= 0):
          self.__children = args['children']
    else: self.__children = 0

  #Get children
  def get_children(self):
    return self.__children

  #Set guest identifier
  def set_guest(self, args):
    if (isinstance(args, dict) and 'guest' in args and
        isinstance(args['guest'], int) and args['guest'] > 0):
          self.__guest = args['guest']
    else: self.__guest = None

  #Get guest identifier
  def get_guest(self):
      return self.__guest

  #Set room identifier
  def set_room_id(self, args):
    if (isinstance(args, dict) and 'roomId' in args and
        isinstance(args['roomId'], int) and args['roomId'] > 0):
          self.__roomId = args['roomId']
    else: self.__roomId = None

  #Get room identifier
  def get_room_id(self):
      return self.__roomId
  
  #Parse result
  def parse_result(self, result):
    
    #Set file
    file    = './data/rooms.json'
    handle  = None
    data    = None
    
    #Open file
    try:
      handle  = open(file, 'r', encoding="utf-8")
      data    = json.load(handle)
    except FileNotFoundError:
      result['isError']   = True
      result['errorMsg']  = "File not found {}!".format(file)
      result['data']      = None
    except OSError:
      result['isError']   = True
      result['errorMsg']  = "Could not open file {}!".format(file)
      result['data']      = None
    except Exception as e:
      result['isError']   = True
      result['errorMsg']  = "{}".format(",".join(e.args))
      result['data']      = None
    finally:
      if (handle):
        handle.close()

    if (isinstance(data, list)):
      for i, row in enumerate(result['data']['rows']):
        index = util.Array.indexOfKey(data, 'id', row['id'])
        if (index != -1):
          result['data']['rows'][i] = util.Dictionary.merge(
            row,
            data[index]
          )
            

    #Return result
    return result

  # Get free rooms
  def getRooms(self):

    #Connect to dabase
    db = util.Database('estidb', True)

    #Check is not error
    if (not db.isError()):

      #Execute transaction
      db.execute(util.Transaction(
        '''
        SELECT  `room`.`id`,
                `room`.`typeID`,
                `type`.`langID`,
                IF(`room`.`space` IS NOT NULL, `room`.`space`, `type`.`space`) as `space`
        FROM `room`
        INNER JOIN `room_type` as `type`
        ON `type`.`id` = `room`.`typeID`
        WHERE `room`.`id` NOT IN 
              (
                SELECT DISTINCT `reservation`.`roomID`
                FROM `room_reservation` as `reservation`
                WHERE ( %s >= `reservation`.`arrival` AND
                        %s <  `reservation`.`leaving`) OR
                      ( %s >  `reservation`.`arrival` AND
                        %s <= `reservation`.`leaving`)
              ) AND
              IF(`room`.`space` IS NOT NULL, `room`.`space`, `type`.`space`) >= %s
        ORDER BY `room`.`id`;
        ''',
        [
          self.get_arrival(True), 
          self.get_arrival(True),
          self.get_leaving(True),
          self.get_leaving(True), 
          self.get_person()
        ]
      ))

      #Get result
      result = db.get_result()

      #Check is not error
      if (not db.isError() and 
          isinstance(result['data']['rows'], list) and
          len(result['data']['rows']) > 0):
        
        #Parse result
        result = self.parse_result(result)
        
      else:

        #Get result
        result = db.get_result()

    else:
      
      #Get result
      result = db.get_result()

    #Close database
    db.close()

    #Set module result
    self.__module.set_result(result)

  #Check the room is still available
  def isRoomFree(self, db:util.Database, result):
    if (len(result['check']['rows']) > 0):
          db.set_error( "The room has been booked in the meantime!", "bookedMeantime")    
          return False
    else: return True

  # Booking
  def booking(self):

    #Connect to dabase
    db = util.Database('estidb', True)

    #Check is not error
    if (not db.isError()):

        #Set transaction
        transactions = [
          util.Transaction(
            '''
              SELECT `id` 
              FROM `room_reservation`
              WHERE	`roomID` = %s AND
                    ((%s >= `arrival` AND
                      %s <  `leaving`) OR
                     (%s >  `arrival` AND
                      %s <= `leaving`));
            ''',
            [
              self.get_room_id(),
              self.get_arrival(True), 
              self.get_arrival(True),
              self.get_leaving(True),
              self.get_leaving(True)
            ],
            {
              'id': 'check',
              'completed': self.isRoomFree
            }
          ),
          util.Transaction(
            '''
            INSERT INTO `room_reservation` 
            (`roomID`, `guestID`, `arrival`, `leaving`, `adults`, `children`,`reservation`) VALUES 
            (%s, %s, %s, %s, %s, %s, %s);
            ''',
            [
              self.get_room_id(),
              self.get_guest(),
              self.get_arrival(True), 
              self.get_leaving(True),
              self.get_adults(), 
              self.get_children(),
              util.Date.dateTimeToStr(
                util.Date.getCurrentDateTime())
            ],
            'insert'
          )
        ]

        #Execute transactions
        db.execute(transactions)

        #Get result
        result = db.get_result()
    else:
      
      #Get result
      result = db.get_result()

    #Close database
    db.close()

    #Set module result
    self.__module.set_result(result)