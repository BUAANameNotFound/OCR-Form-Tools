'''主函数'''
import handle_json as hj
import handle_excel as he
import show_excel as se

NUM = 4
PATH = "wow.xlsx"
# num是PDF的总数量

pdf_names = []
labels_name = []
data_list = []

if __name__ == '__main__':
    for i in range(NUM):
        FILENAME = 'out' + str(i + 1) + '.json'
        label_string_list = hj.read_single_json(FILENAME)
        pdf_names.append(label_string_list[0])
        labels_name.append(label_string_list[1])
        data_list.append(label_string_list[2])
    he.new_excel(PATH)
    he.write_pdf_names(pdf_names, PATH)
    he.write_pdf_data(labels_name, data_list, PATH)
    se.read_excel(PATH)
