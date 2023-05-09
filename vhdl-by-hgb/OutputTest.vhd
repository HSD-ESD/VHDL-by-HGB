library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity LedControl is
  generic (
    gNrOfLeds : natural := 10
  );
  port (
    inRstAsync   : in std_ulogic;
    iClk         : in std_ulogic;
    --Ansteuerung leds
    iAdr         : in std_ulogic_vector(3 downto 0);
    iData        : in std_ulogic_vector(31 downto 0);
    iWrite       : in std_ulogic;
    --Output
    oData        : out std_ulogic_vector(31 downto 0);
    oLed         : out std_ulogic_vector(gNrOfLeds-1 downto 0)
    );
end LedControl;





