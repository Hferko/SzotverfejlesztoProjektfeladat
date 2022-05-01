from module import Module
import utility as util

class User:

  #Constructor
  def __init__(self, module:Module=None, args=None) -> None:

    #Set attributes
    self.__module = module
    self.set_properties(args)

  #Set properties
  def set_properties(self, args):
    self.__properties = args

  #Get property or properties
  def get_properties(self, key=None):

    #Check key exist, and properties has key property
    if (self.__properties and isinstance(key, str) and key in self.__properties):
          return self.__properties[key]
    else: return self.__properties

  #Parse result
  def parse_result(self, result):
    
    #Set result
    result['data'] = result['data']['rows'][0]

    #Set name keys
    keys1 = ['prefix_name','first_name','middle_name','last_name','postfix_name']
    keys2 = ['prefix','first','middle','last','postfix']

    #Set user name
    result['data']['name'] = {}

    #Each keys
    for i, key in enumerate(keys1):
      result['data']['name'][keys2[i]] = result['data'][key]
      del result['data'][key]
    
    #Return result
    return result

  #Get user
  def getUser(self):
    
    #Connect to dabase
    db = util.Database('estidb', True)

    #Check is not error
    if (not db.isError()):

      #Execute transaction
      db.execute(util.Transaction(
        '''
        SELECT  `user`.`id`,
                `user`.`prefix_name`,
                `user`.`first_name`,
                `user`.`middle_name`,
                `user`.`last_name`,
                `user`.`postfix_name`,
                `user`.`password`,
                `user`.`valid`,
                `user`.`attempts`
        FROM `user`
        WHERE BINARY `user`.`user` = BINARY %s;
        ''',
        [self.__properties['user']]
      ))

      #Get result
      result = db.get_result()

      #Check is not error
      if (not db.isError()):
  
        #Check user exist
        if (isinstance(result['data']['rows'], list) and
            len(result['data']['rows']) > 0):

          #Parse result
          result = self.parse_result(result)

          #Check user is valid
          if (result['data']['valid']):

            #Check attempts count is lower then six
            if (result['data']['attempts'] < 5):

              #Check password
              if (result['data']['password'] == 
                  self.__properties['password']):

                #Remove not neccessery key
                del result['data']['valid']
                del result['data']['attempts']
                del result['data']['password']
                
                #Execute transaction
                db.execute(util.Transaction(
                  '''
                  UPDATE  `user` SET 
                          `user`.`last_logon` = %s, 
                          `user`.`attempts` = %s 
                  WHERE   `user`.`id`= %s;
                  ''',
                  [
                    util.Date.dateTimeToStr(
                      util.Date.getCurrentDateTime()),
                    0,
                    result['data']['id']
                  ]
                ))

              else:

                #Execute transaction
                db.execute(util.Transaction(
                  '''
                  UPDATE  `user` SET 
                          `user`.`last_attempt` = %s, 
                          `user`.`attempts` = %s 
                  WHERE   `user`.`id`= %s;
                  ''',
                  [
                    util.Date.dateTimeToStr(
                      util.Date.getCurrentDateTime()),
                    result['data']['attempts'] + 1,
                    result['data']['id']
                  ]
                ))

                #Set error, and get result
                db.set_error( "User password is not valid!", 
                              "userPasswordNotValid")
                result = db.get_result()

            else:

              #Execute transaction
              db.execute(util.Transaction(
                '''
                UPDATE  `user` SET 
                        `user`.`last_attempt` = %s,
                        `user`.`valid` = %s 
                WHERE   `user`.`id`= %s;
                ''',
                [
                  util.Date.dateTimeToStr(
                    util.Date.getCurrentDateTime()),
                  0,
                  result['data']['id']
                ]
              ))

              #Set error, and get result
              db.set_error( "The number of attempts is greater than allowed!",
                            "numberOfAttemptsGreater")
              result = db.get_result()

          else:
            
            #Set error, and get result
            db.set_error( "User is not valid!",
                          "userNotValid")
            result = db.get_result()

        else:
            
            #Set error, and get result
            db.set_error( "User not exist!", 
                          "userNotExist")
            result = db.get_result()
    
    else:
      
      #Get result
      result = db.get_result()

    #Close database
    db.close()

    #Set module result
    self.__module.set_result(result)

  def getUserData(self):

    #Connect to dabase
    db = util.Database('estidb', True)

    #Check is not error
    if (not db.isError()):

      #Execute transaction
      db.execute(util.Transaction(
        '''
        SELECT  `user`.`prefix_name`  as `prefixName`,
                `user`.`first_name`   as `firstName`,
                `user`.`middle_name`  as `middleName`,
                `user`.`last_name`    as `lastName`,
                `user`.`postfix_name` as `postfixName`,
                `user`.`gender`       as `gender`,
                `user`.`born`         as `birthday`,
                `user`.`email`        as `email`,
                `user`.`user`         as `loginName`,
                `user`.`password`     as `password`,
                `user`.`password`     as `passwordAgain`
        FROM `user`
        WHERE `user`.`id` = %s;
        ''',
        [self.__properties['id']]
      ))

      #Check is not error
      if (not db.isError()):

        #Get result
        result = db.get_result()
        
        #Check user exist
        if (isinstance(result['data']['rows'], list) and
            len(result['data']['rows']) > 0):

          #Set result
          result['data'] = result['data']['rows'][0]
          result['data']['birthday'] = result['data']['birthday'].strftime('%Y.%m.%d')
      
        else:

          #Set error, and get result
          db.set_error( "User not exist!", 
                        "userNotExist")
          result = db.get_result()

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

  #Check user not exist
  def isUserNotExist(self, db:util.Database, result):
    if (len(result['check']['rows']) > 0):
          db.set_error( "User already exists!", "userExists")    
          return False
    else: return True

  #Registration
  def registration(self):
    
    #Connect to dabase
    db = util.Database('estidb', True)

    #Check is not error
    if (not db.isError()):

      #Set transaction
      transactions = [
        util.Transaction(
          '''
            SELECT `id` 
            FROM `user`
            WHERE	`user` = %s;
          ''',
          [
            self.__properties['loginName']
          ],
          {
            'id': 'check',
            'completed': self.isUserNotExist
          }
        ),
        util.Transaction(
          '''
          INSERT INTO `user`
          ( `type`, `prefix_name`,`first_name`, `middle_name`,`last_name`,   
            `postfix_name`, `gender`, `born`, `email`, `user`, `password`) VALUES 
          ('G', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
          ''',
          [
            self.__properties['prefixName'],
            self.__properties['firstName'],
            self.__properties['middleName'],
            self.__properties['lastName'],
            self.__properties['postfixName'],
            self.__properties['gender'],
            self.__properties['birthday'],
            self.__properties['email'],
            self.__properties['loginName'],
            self.__properties['password']
          ],
          'insert'
        )
      ]

      #Execute transactions
      db.execute(transactions)

      #Get result
      result = db.get_result()

      #Check is not error
      if (not db.isError()):

        #Check success
        if (result['data']['insert']['rowsAffected']):

          #Set data
          result['data'] = {
            'id': result['data']['insert']['lastAutoIncId'],
            'name': {
              'prefix': self.__properties['prefixName'],
              'first':  self.__properties['firstName'],
              'middle': self.__properties['middleName'],
              'last':   self.__properties['lastName'],
              'postfix':self.__properties['postfixName']
            }
          }

        else:

          #Set error, and get result
          db.set_error( "Create user failed!", 
                        "createUserFailed")
          result = db.get_result()

    else:
      
      #Get result
      result = db.get_result()

    #Close database
    db.close()

    #Set module result
    self.__module.set_result(result)

  #Modify
  def modify(self):

    #Connect to dabase
    db = util.Database('estidb', True)

    #Check is not error
    if (not db.isError()):

      #Set transaction
      transactions = [
        util.Transaction(
          '''
            SELECT `id` 
            FROM `user`
            WHERE	`id` != %s AND `user` = %s;
          ''',
          [
            self.__properties['id'],
            self.__properties['loginName']
          ],
          {
            'id': 'check',
            'completed': self.isUserExist
          }
        ),
        util.Transaction(
          '''
          UPDATE `user` SET 
            `prefix_name` = %s,
            `first_name` = %s,
            `middle_name` = %s,
            `last_name` = %s,
            `postfix_name` = %s,
            `gender`= %s,
            `born` = %s,
            `email`= %s,
            `user`= %s,
            `password`= %s
          WHERE `id` = %s
          ''',
          [
            self.__properties['prefixName'],
            self.__properties['firstName'],
            self.__properties['middleName'],
            self.__properties['lastName'],
            self.__properties['postfixName'],
            self.__properties['gender'],
            self.__properties['birthday'],
            self.__properties['email'],
            self.__properties['loginName'],
            self.__properties['password'],
            self.__properties['id']
          ],
          'update'
        )
      ]

      #Execute transactions
      db.execute(transactions)

      #Get result
      result = db.get_result()

      #Check is not error
      if (not db.isError()):
        
        #Check success
        if (result['data']['update']['rowsAffected']):

          #Set data
          result['data'] = {
            'id': self.__properties['id'],
            'name': {
              'prefix': self.__properties['prefixName'],
              'first':  self.__properties['firstName'],
              'middle': self.__properties['middleName'],
              'last':   self.__properties['lastName'],
              'postfix':self.__properties['postfixName']
            }
          }

        else:

          #Set error, and get result
          db.set_error( "Changing data failed!", 
                        "changingDataFailed")
          result = db.get_result()
    else:
      
      #Get result
      result = db.get_result()

    #Close database
    db.close()

    #Set module result
    self.__module.set_result(result)