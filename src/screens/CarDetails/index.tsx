import React, { useEffect, useState } from 'react';
import { Accessory } from '../../components/Accessory';
import { BackButton } from '../../components/BackButton';
import { ImageSlider } from '../../components/ImageSlider';
import { Button } from '../../components/Button';
import Animated, { 
  Extrapolate, 
  interpolate, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  useSharedValue 
} from 'react-native-reanimated';

import * as S from './styles';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../Home';
import { RouteProp } from '@react-navigation/native';
import { getAccessoryIcon } from '../../utils/getAccessoryIcon';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { StatusBar, StyleSheet } from 'react-native';
import { useTheme } from 'styled-components';
import { CarDTO } from '../../dtos/CarDTO';
import { Car as ModelCar } from '../../database/model/Car';
import api from '../../services/api';
import { useNetInfo } from '@react-native-community/netinfo';

type NextScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CarDetails'
>;

type NextScreenRouteProp = RouteProp<
  RootStackParamList, 
  'CarDetails'
>;

type NextScreenProps = {
  navigation: NextScreenNavigationProp;
  route: NextScreenRouteProp;
}

interface Params {
  car: ModelCar;
}

export function CarDetails({ navigation, route }: NextScreenProps){
  const [updatedCar, setUpdatedCar] = useState<CarDTO>({} as CarDTO);

  const netInfo  = useNetInfo();
  const { car } = route.params as Params
  const theme = useTheme()
  console.log(car)

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyleAnimation = useAnimatedStyle(() => {
    return {
      height: interpolate(
        scrollY.value,
        [0, 200],
        [200, 70],
        Extrapolate.CLAMP
      ),
    }
  });

  const sliderCarsStyleAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, 150],
        [1, 0],
        Extrapolate.CLAMP
      ),
    }
  });

  function handleScheduling() {
    navigation.navigate('Scheduling', { car })
  };

  function handleBack() {
    navigation.goBack();
  };

  useEffect(() => {
    async function fetchUpdatedCar() {
      const response = await api.get(`/cars/${car.id}`);
      setUpdatedCar(response.data);
    }
    if(netInfo.isConnected === true) {
      fetchUpdatedCar();
    }
  },[netInfo.isConnected])

  return (
    <S.Container >
      <StatusBar 
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <Animated.View
        style={[
          headerStyleAnimation, 
          styles.header,
          { backgroundColor: theme.colors.background_secondary }
        ]}
      >
        <S.Header>
          <BackButton onPress={handleBack}/>
        </S.Header>
        <Animated.View style={sliderCarsStyleAnimation}>
          <S.CarImages>
            <ImageSlider 
              imagesUrl={!!updatedCar.photos ? 
                updatedCar.photos : [{ id: car.thumbnail, photo: car.thumbnail }]}
            />
          </S.CarImages>
        </Animated.View>
      </Animated.View>
      
      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: getStatusBarHeight() + 160,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <S.Details>
          <S.Description>
            <S.Brand>{car.brand}</S.Brand>
            <S.Name>{car.name}</S.Name>
          </S.Description>

          <S.Rent>
            <S.Period>{car.period}</S.Period>
            <S.Price>R$ {netInfo.isConnected === true ? car.price : '...'}</S.Price>
          </S.Rent>
        </S.Details>

        { 
          updatedCar.accessories &&
          <S.Accessories>
            {
              updatedCar.accessories.map(accessory => (
                <Accessory 
                  key={accessory.type}
                  name={accessory.name}
                  icon={getAccessoryIcon(accessory.type)}
                />
              ))
            }
          </S.Accessories>
        }

        <S.About>
          {car.about}
        </S.About>
      </Animated.ScrollView>

      <S.Footer>
        <Button 
          title="Escolher período do aluguel"
          onPress={handleScheduling}
          enabled={netInfo.isConnected === true}
        />

        {
          netInfo.isConnected === false &&
          <S.OfflineInfo>
            Conecte-se a internet para ver mais detalhes e agendar seu carro.
          </S.OfflineInfo>
        }
      </S.Footer>
    </S.Container>
  )
} 

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 1,
  }
})