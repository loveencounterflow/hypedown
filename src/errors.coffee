'use strict'


############################################################################################################
{ rpr }                   = ( require 'guy' ).trm


#-----------------------------------------------------------------------------------------------------------
class @Hypedown_error extends Error
  constructor: ( ref, message ) ->
    super()
    @message  = "#{ref} (#{@constructor.name}) #{message}"
    @ref      = ref
    return undefined ### always return `undefined` from constructor ###

#-----------------------------------------------------------------------------------------------------------
class @Hypedown_internal_error            extends @Hypedown_error
  constructor: ( ref, message )     -> super ref, message
class @Hypedown_not_implemented           extends @Hypedown_error
  constructor: ( ref, feature )     -> super ref, "#{feature} not implemented"
class @Hypedown_TBDUNCLASSIFIED           extends @Hypedown_error
  constructor: ( ref, message )     -> super ref, message


