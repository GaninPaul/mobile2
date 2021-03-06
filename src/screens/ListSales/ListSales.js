import React from "react";
import {ScrollView, Text, View} from "react-native";
import {get} from "service/api";
import {observer} from "mobx-react";
import {observable} from "mobx";
import Toast from "react-native-easy-toast";
import {defaultNavigationOptions} from "entry/utils";
import styles from "./ListSales.styles";
import RoundButton from "components/RoundButton";
import {BUTTONS_SIZES} from "utils/constants";
import {getServerAddress} from "../../service/Setup";
import moment from "moment";

const PAGE_SIZE = 50;
const START_PAGE = 1;
const URL = `/api/shop/sales/?page%5Bnumber%5D=${START_PAGE}&page%5Bsize%5D=${PAGE_SIZE}`;

@observer
class ListSales extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: "Список продаж",
    ...defaultNavigationOptions(navigation)
  });

  @observable isLoading = false;
  @observable inputValue = "";
  @observable listSales = [];
  toastRef = React.createRef();
  nextPageUrl = "";
  lastPageUrl = "";

  fetch = async (url = URL) => {
    try {
      this.isLoading = true;
      const response = await get({
        url
      });
      if (response) {
        if (response.results) {
          this.listSales = response.results;
        }
        if (response.links) {
          const serverAddress = getServerAddress();
          if (response.links.next) {
            const next = response.links.next;
            this.nextPageUrl = next.replace(serverAddress, "");
          } else {
            this.nextPageUrl = "";
          }
          if (response.links.prev) {
            const prev = response.links.prev;
            this.lastPageUrl = prev.replace(serverAddress, "");
          } else {
            this.lastPageUrl = "";
          }
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      this.isLoading = false;
    }
  };
  async componentDidMount() {
    await this.fetch();
  }
  backPage = async () => {
    if (!this.lastPageUrl) {
      return;
    }
    await this.fetch(this.lastPageUrl);
  };

  nextPage = async () => {
    if (!this.nextPageUrl) {
      return;
    }
    await this.fetch(this.nextPageUrl);
  };

  handleControlPanel = () => {
    const { state, goBack } = this.props.navigation;
    goBack(state.key);
  };

  renderItems = () => {
    const listSales = this.listSales;
    if (listSales && listSales.length) {
      return this.listSales.map((item, index) => {
        let price = 0;
        item.product_list.forEach(item => {
          price += item.price;
        });
        return this.renderItem({ id: item.id, date: item.date, price, index });
      });
    }
    return null;
  };

  renderItem = ({ id, date, price, index }) => {
    return (
      <View key={index} style={styles.header}>
        <Text style={styles.headerId}>{id}</Text>
        <Text style={styles.headerWhen}>
          {moment(date)
            .format("YYYY-MM-DD HH:mm")
            .toString()}
        </Text>
        <Text style={styles.headerPrice}>{price}</Text>
      </View>
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <View>
            <View style={styles.header}>
              <Text style={styles.headerId}>№</Text>
              <Text style={styles.headerWhen}>Когда</Text>
              <Text style={styles.headerPrice}>Сумма</Text>
            </View>
            {this.renderItems()}
          </View>
          <View style={styles.paginationWrapper}>
            <RoundButton
              title="<- Сюда"
              onPress={this.backPage}
              isLoading={this.isLoading}
              disabled={this.isLoading && this.page <= 1}
              style={styles.button}
              size={BUTTONS_SIZES.SMALL}
            />
            <RoundButton
              title="Туда ->"
              onPress={this.nextPage}
              isLoading={this.isLoading}
              disabled={this.isLoading}
              style={styles.button}
              size={BUTTONS_SIZES.SMALL}
            />
          </View>
        </ScrollView>
        <Toast ref={this.toastRef} />
      </View>
    );
  }
}

export default ListSales;
